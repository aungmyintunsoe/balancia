'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function generateMockProject(formData: FormData) {
    const supabase = await createClient()
    
    const vagueGoalText = formData.get('vagueGoalText') as string
    const orgId = formData.get('orgId') as string

    // 1. Initial Insert: Create the project entry
    const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
            org_id: orgId,
            vague_goal_text: vagueGoalText,
            status: 'active' // In a real app we'd start at 'analyzing'
        })
        .select()
        .single()

    if (projError) throw projError

    // 2. SIMULATE AI THINKING (2-second delay)
    await new Promise(res => setTimeout(res, 2000))

    // 3. MOCK DATA (In Phase 3, this will come from an LLM)
    const mockGoals = [
        { description: "Phase 1: Tech Architecture & Research" },
        { description: "Phase 2: UI/UX Implementation" }
    ]

    // 4. Batch Insert Goals
    for (const goal of mockGoals) {
        const { data: insertedGoal, error: goalError } = await supabase
            .from('structured_goals')
            .insert({
                project_id: project.id,
                org_id: orgId,
                description: goal.description
            })
            .select()
            .single()

        if (goalError) throw goalError

        // 5. Create 2 tasks for each goal
        await supabase.from('tasks').insert([
            {
                goal_id: insertedGoal.id,
                org_id: orgId,
                description: `Draft requirements for ${goal.description}`,
                estimated_hours: 4
            },
            {
                goal_id: insertedGoal.id,
                org_id: orgId,
                description: `Execute core development for ${goal.description}`,
                estimated_hours: 8
            }
        ])
    }

    revalidatePath(`/org/${orgId}/dashboard`)
}
