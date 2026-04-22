'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateObject } from "ai"
import { z } from "zod"
import { ilmu, ILMU_MODEL } from "@/lib/ilmu"

export async function generateProject(formData: FormData) {
    const supabase = await createClient()
    
    const vagueGoalText = formData.get('vagueGoalText') as string
    const orgId = formData.get('orgId') as string

    // 1. Context Gathering: Fetch team roster and skills
    // We fetch user_id and their related skills
    const { data: teamData, error: teamError } = await supabase
        .from('organization_members')
        .select(`
            user_id,
            employee_skills (
                skill_name,
                proficiency_level
            )
        `)
        .eq('org_id', orgId);

    if (teamError) throw teamError;

    // 2. Initial Insert: Create the project entry
    const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
            org_id: orgId,
            vague_goal_text: vagueGoalText,
            status: 'analyzing' 
        })
        .select()
        .single()

    if (projError) throw projError

    try {
        // 3. The AI Call: Using 'Opti' the AI Tech Lead
        const { object } = await generateObject({
            model: ilmu(ILMU_MODEL),
            system: `You are 'Opti', an AI Tech Lead. Break the user's project goal into 2-3 structured goals, and 2-4 micro-tasks per goal. 
            You MUST assign each task to a specific user ID from the provided team roster based on their skills. 
            Return ONLY valid JSON matching the schema.`,
            prompt: `Project Goal: "${vagueGoalText}"
            
            Team Roster with Skills:
            ${JSON.stringify(teamData, null, 2)}
            
            Generate the structured roadmap.`,
            schema: z.object({
                goals: z.array(z.object({
                    description: z.string(),
                    tasks: z.array(z.object({
                        description: z.string(),
                        estimated_hours: z.number(),
                        assigned_to: z.string().uuid()
                    }))
                }))
            }),
        });

        // 4. Database Execution: Batch insert goals and tasks
        for (const goal of object.goals) {
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

            // Map goal ID to tasks and insert
            const tasksToInsert = goal.tasks.map(t => ({
                ...t,
                goal_id: insertedGoal.id,
                org_id: orgId,
                status: 'todo'
            }));

            const { error: tasksError } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

            if (tasksError) throw tasksError;
        }

        // 5. Update project status to active
        await supabase
            .from('projects')
            .update({ status: 'active' })
            .eq('id', project.id);

    } catch (error) {
        console.error("AI Generation Error:", error);
        // Update project status to failed if AI or DB fails
        await supabase
            .from('projects')
            .update({ status: 'failed' })
            .eq('id', project.id);
        throw error;
    }

    revalidatePath(`/org/${orgId}/dashboard`)
}
