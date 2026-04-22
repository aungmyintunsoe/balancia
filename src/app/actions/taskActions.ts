// src/app/actions/taskActions.ts
'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { z } from "zod";
import { ilmu, ILMU_MODEL } from "@/lib/ilmu";

export async function updateTaskStatus(taskId: string, newStatus: string, orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('assigned_to', user.id); // Security: Ensure they own the task

    if (error) {
        console.error("Update error:", error);
        return { success: false, error: error.message };
    }

    // Refresh the specific dashboard page to show the new status
    revalidatePath(`/org/${orgId}/dashboard`);
    return { success: true };
}

export async function reportFriction(taskId: string, complaintText: string, orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('tasks')
        .update({
            status: 'blocked',
            blocker_reason: complaintText // Capturing the friction!
        })
        .eq('id', taskId)
        .eq('assigned_to', user.id);

    if (error) {
        console.error("Friction report error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/org/${orgId}/dashboard`);
    return { success: true };
}


export async function assignTask(taskId: string, userId: string, orgId: string) {
    const supabase = await createClient();

    // Security: Verify the caller is an admin of this organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    if (membership?.role !== 'admin') {
        throw new Error("Only managers can assign tasks");
    }

    const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId);

    if (error) {
        console.error("Assignment error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/org/${orgId}/dashboard`);
    return { success: true };
}

export async function generatePivotStrategy(taskId: string, orgId: string) {
    const supabase = await createClient();

    // 1. Fetch the blocked task
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (taskError) throw taskError;

    // 2. Fetch Team Context (Skills)
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

    // 3. Fetch Active Workload (tasks that are NOT completed)
    const { data: activeTasks, error: workError } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('org_id', orgId)
        .neq('status', 'completed');

    if (workError) throw workError;

    // Map workload to users
    const teamWithWorkload = teamData.map(member => {
        const workload = activeTasks.filter(t => t.assigned_to === member.user_id).length;
        return {
            ...member,
            current_workload_count: workload
        };
    });

    try {
        // 4. The AI Call: Suggest a pivot
        const { object } = await generateObject({
            model: ilmu(ILMU_MODEL),
            system: `An employee is stuck on a task. Read their 'blocker_reason'. 
            Review the rest of the team's skills and current workload. 
            Suggest a new employee to reassign this task to. 
            The new assignee MUST have the right skills and ideally the lowest current workload.`,
            prompt: `
                Blocked Task: "${task.description}"
                Blocker Reason: "${task.blocker_reason}"
                Current Assignee: ${task.assigned_to}

                Team Roster (Skills & Workload):
                ${JSON.stringify(teamWithWorkload, null, 2)}
            `,
            schema: z.object({
                recommended_user_id: z.string().uuid(),
                reasoning: z.string().describe("A short, 1-sentence explanation of why this person was chosen based on skills/workload.")
            }),
        });

        // 5. Fetch recommended user details
        const { data: recommendedProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', object.recommended_user_id)
            .single();

        return { 
            success: true, 
            recommendation: {
                ...object,
                recommended_user_name: recommendedProfile?.full_name || "Unknown User"
            } 
        };
    } catch (error) {
        console.error("Pivot AI Error:", error);
        return { success: false, error: "Failed to generate pivot strategy" };
    }
}
