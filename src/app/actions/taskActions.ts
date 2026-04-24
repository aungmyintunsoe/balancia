'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { ilmu, ILMU_MODEL } from "../../lib/ilmu";
import { unwrapRelation } from "@/lib/supabase/relations";

export async function updateTaskStatus(taskId: string, newStatus: string, orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if user is an admin of this org (admins can update any task, e.g. resolving friction board)
    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

    const isAdmin = membership?.role === 'admin';

    // Build the update query — admins can update any task in the org, employees only their own
    let query = supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('org_id', orgId);

    if (!isAdmin) {
        query = query.eq('assigned_to', user.id); // Security: employees can only update their own tasks
    }

    const { data: updatedRows, error } = await query.select('id');

    if (error) {
        console.error("Update error:", error);
        return { success: false, error: error.message };
    }
    if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: "Status update was blocked by permissions or task ownership." };
    }

    // Refresh all pages that show task status
    revalidatePath(`/org/${orgId}/dashboard`);
    revalidatePath(`/org/${orgId}/tasks`);
    revalidatePath(`/org/${orgId}/goals`);
    revalidatePath(`/org/${orgId}/analytics`);
    return { success: true };
}

export async function reportFriction(taskId: string, complaintText: string, orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: updatedRows, error } = await supabase
        .from('tasks')
        .update({
            status: 'blocked',
            blocker_reason: complaintText // Capturing the friction!
        })
        .eq('id', taskId)
        .eq('assigned_to', user.id)
        .eq('org_id', orgId)
        .select('id');

    if (error) {
        console.error("Friction report error:", error);
        return { success: false, error: error.message };
    }
    if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: "SOS report was blocked by permissions or task ownership." };
    }

    revalidatePath(`/org/${orgId}/dashboard`);
    revalidatePath(`/org/${orgId}/tasks`);
    revalidatePath(`/org/${orgId}/goals`);
    revalidatePath(`/org/${orgId}/analytics`);
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

    const { data: targetMembership } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .maybeSingle();

    if (!targetMembership) {
        return { success: false, error: "Selected assignee is not a member of this organization." };
    }

    const { data: updatedRows, error } = await supabase
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId)
        .eq('org_id', orgId)
        .select('id');

    if (error) {
        console.error("Assignment error:", error);
        return { success: false, error: error.message };
    }
    if (!updatedRows || updatedRows.length === 0) {
        return {
            success: false,
            error: "Assignment was blocked by permissions. Please update your tasks RLS policy to allow organization admins to reassign tasks.",
        };
    }

    revalidatePath(`/org/${orgId}/dashboard`);
    revalidatePath(`/org/${orgId}/goals`);
    revalidatePath(`/org/${orgId}/tasks`);
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
            role,
            employee_skills (
                skill_name,
                proficiency_level
            )
        `)
        .eq('org_id', orgId);

    if (teamError) throw teamError;

    // Filter to only include employees for reassignment
    const employeeMembers = teamData.filter(m => m.role === 'employee');
    const rosterToConsider = employeeMembers.length > 0 ? employeeMembers : teamData;

    // 3. Fetch Active Workload (tasks that are NOT done)
    const { data: activeTasks, error: workError } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('org_id', orgId)
        .neq('status', 'done');

    if (workError) throw workError;

    // Map workload to users and filter out the current assignee
    const candidates = rosterToConsider
        .filter(m => m.user_id !== task.assigned_to)
        .map(member => {
            const workload = activeTasks.filter(t => t.assigned_to === member.user_id).length;
            return {
                ...member,
                current_workload_count: workload
            };
        });

    if (candidates.length === 0) {
        return {
            success: false,
            error: "No other team members are available to take over this task. You might need to add more people to your Balancia workspace."
        };
    }

    try {
        console.log("Pivoting with model:", ILMU_MODEL);
        console.log("Candidate Data for AI:", JSON.stringify(candidates, null, 2));

        // 4. The AI Call: Suggest a pivot
        const { text } = await generateText({
            model: ilmu.chat(ILMU_MODEL),
            system: `An employee is stuck on a task. Suggest a new employee to reassign this task to. 
            The new assignee MUST have the right skills and ideally the lowest current workload.
            CRITICAL: Return ONLY a raw JSON object. Do not include markdown code blocks, preambles, or any other text.
            The JSON MUST match this schema exactly:
            {
              "recommended_user_id": "uuid-string-here",
              "reasoning": "A short, 1-sentence explanation of why this person was chosen based on skills/workload."
            }`,
            prompt: `
                Blocked Task: "${task.description}"
                Blocker Reason: "${task.blocker_reason}"
                Current Assignee: ${task.assigned_to}

                Team Roster (Skills & Workload):
                ${JSON.stringify(candidates, null, 2)}
            `,
        });

        console.log("RAW AI RESPONSE:", text);

        let object;
        try {
            const startIndex = text.indexOf('{');
            const endIndex = text.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error("No JSON boundaries found");
            }
            const jsonStr = text.substring(startIndex, endIndex + 1);
            object = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("JSON Parse Error. Raw Text was:", text);
            throw new Error(`AI returned invalid format: ${text.substring(0, 80)}...`);
        }

        if (!object || !object.recommended_user_id) throw new Error("Failed to generate a valid pivot recommendation");

        // 5. Fetch recommended user details
        const { data: recommendedProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', object.recommended_user_id)
            .single();

        const normalizedProfile = unwrapRelation(recommendedProfile as any);

        return {
            success: true,
            recommendation: {
                ...object,
                recommended_user_name: normalizedProfile?.full_name || "Unknown User"
            }
        };
    } catch (error) {
        console.error("Pivot AI Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate pivot strategy",
            stack: error instanceof Error ? error.stack : undefined
        };
    }
}

export async function syncSkills(skills: { skill_name: string; proficiency_level: number }[], orgId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error: deleteError } = await supabase.from('employee_skills').delete().eq('user_id', user.id);
    if (deleteError) {
        return { success: false, error: deleteError.message };
    }

    if (skills.length > 0) {
        const toInsert = skills.map(s => ({
            user_id: user.id,
            skill_name: s.skill_name,
            proficiency_level: s.proficiency_level
        }));

        const { error } = await supabase.from('employee_skills').insert(toInsert);
        if (error) {
            return { success: false, error: error.message };
        }
    }

    // Revalidate all pages where skills are displayed
    revalidatePath(`/workspaces`);
    if (orgId) {
        revalidatePath(`/org/${orgId}/employees`);
        revalidatePath(`/org/${orgId}/analytics`);
        revalidatePath(`/org/${orgId}/dashboard`);
        revalidatePath(`/org/${orgId}/profile`);
        revalidatePath(`/org/${orgId}/goals`);
    } else {
        // Fallback: revalidate all org pages by fetching user's memberships
        const { data: memberships } = await supabase
            .from('organization_members')
            .select('org_id')
            .eq('user_id', user.id);
        for (const m of memberships || []) {
            revalidatePath(`/org/${m.org_id}/employees`);
            revalidatePath(`/org/${m.org_id}/analytics`);
            revalidatePath(`/org/${m.org_id}/dashboard`);
            revalidatePath(`/org/${m.org_id}/profile`);
        }
    }
    return { success: true };
}

export async function redistributeTasks(orgId: string, overworkedUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // NEW: Verify caller is an admin
    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

    if (membership?.role !== 'admin') {
        throw new Error("Only managers can redistribute tasks");
    }

    console.log(`Starting task redistribution for user: ${overworkedUserId}`);

    // Step 1: Find tasks that are assigned to this person and are currently active
    // Step 2: Unassign them (set assigned_to to null) and set status back to 'todo'
    const { error } = await supabase
        .from('tasks')
        .update({ 
            assigned_to: null, 
            status: 'todo' 
        })
        .eq('assigned_to', overworkedUserId)
        .eq('org_id', orgId)
        .in('status', ['in_progress', 'blocked']);

    if (error) {
        console.error("Failed to redistribute tasks:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/org/${orgId}/dashboard`);
    revalidatePath(`/org/${orgId}/tasks`);
    revalidatePath(`/org/${orgId}/analytics`);
    
    return { success: true };
}