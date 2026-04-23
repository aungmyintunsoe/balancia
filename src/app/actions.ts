'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateText } from "ai"
import { ilmu, ILMU_MODEL } from "../lib/ilmu"

type TeamMember = {
    user_id: string;
    role: 'admin' | 'employee';
    profiles?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null;
    employee_skills?: { skill_name: string; proficiency_level: number }[] | null;
};

export async function generateProject(formData: FormData) {
    const supabase = await createClient()

    const vagueGoalText = formData.get('vagueGoalText') as string
    const orgId = formData.get('orgId') as string

    // 1. Context Gathering: Fetch team roster (gracefully handle missing skills table)
    let teamData: TeamMember[] = [];
    const { data: { user } } = await supabase.auth.getUser();

    try {
        const { data, error: teamError } = await supabase
            .from('organization_members')
            .select(`
                user_id,
                role,
                profiles (
                    full_name,
                    email
                ),
                employee_skills (
                    skill_name,
                    proficiency_level
                )
            `)
            .eq('org_id', orgId);

        if (!teamError && data && data.length > 0) {
            teamData = (data ?? []) as TeamMember[];
            const employeesOnly = teamData.filter(m => m.role === 'employee');
            console.log(`DEBUG: Found ${employeesOnly.length} employees out of ${teamData.length} total members.`);
        } else {
            // Fallback: If no team, use the current user as the only resource
            teamData = user?.id ? [{ user_id: user.id, role: 'admin', employee_skills: [] }] : [];
            console.log("DEBUG: No team found, falling back to current user.");
        }
    } catch (e) {
        console.error("DEBUG: Team Fetch Error:", e);
        teamData = user?.id ? [{ user_id: user.id, role: 'admin', employee_skills: [] }] : [];
    }

    const aiRoster = teamData.map((member) => {
        const profileRaw = member.profiles;
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
        const displayName = profile?.full_name || profile?.email || `Member ${member.user_id.slice(0, 8)}`;
        return {
            user_id: member.user_id,
            display_name: displayName,
            role: member.role,
            role_priority: member.role === 'employee' ? 'primary_executor' : 'manager_fallback',
            skills: member.employee_skills ?? [],
        };
    });
    const preferredAssigneeIds = aiRoster
        .filter((member) => member.role === 'employee')
        .map((member) => member.user_id);
    const allowedAssigneeIds = aiRoster.map((member) => member.user_id);

    console.log("DEBUG: Final Team Data to AI:", JSON.stringify(aiRoster, null, 2));

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

    if (projError) {
        console.error("Project insert error:", projError);
        throw new Error("Failed to initialize project");
    }

    try {
        console.log("Orchestrating with model:", ILMU_MODEL);
        console.log("Team Data for AI:", JSON.stringify(teamData, null, 2));

        // 3. The AI Call: Using 'Opti' the AI Tech Lead
        const { text } = await generateText({
            model: ilmu.chat(ILMU_MODEL),
            system: `You are 'Opti', an AI Tech Lead. Break the user's project goal into 2-3 structured goals, and 2-4 micro-tasks per goal. 
            
            DISTRIBUTION RULES:
            1. You MUST assign each task to a specific user ID from the provided team roster.
            2. Match the task requirements to the 'employee_skills' listed for each user.
            3. Prioritize 'proficiency_level' (1-5) when multiple users have the same skill.
            4. Balance the workload—do not assign all tasks to one person if others are available.
            5. If no one has the exact skill, assign to the most versatile member.
            6. Prefer assignees in "preferred_assignee_ids". Only use non-preferred assignees if preferred list is empty.
            7. Use the person's display_name + skills for reasoning, never "first item" behavior.

            CRITICAL: Return ONLY a raw JSON object. Do not include markdown code blocks, preambles, or any other text.
            The JSON MUST match this schema exactly:
            {
              "goals": [
                {
                  "description": "Goal string",
                  "tasks": [
                    { "description": "Task string", "estimated_hours": 2, "assigned_to": "uuid-string-here" }
                  ]
                }
              ]
            }`,
            prompt: `Project Goal: "${vagueGoalText}"
            
            Team Roster (Context):
            ${JSON.stringify(aiRoster, null, 2)}

            Preferred assignee IDs:
            ${JSON.stringify(preferredAssigneeIds, null, 2)}

            Allowed assignee IDs:
            ${JSON.stringify(allowedAssigneeIds, null, 2)}
            
            Generate the structured roadmap based on the team's specific skills.`,
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

        if (!object || !object.goals) {
            throw new Error("Failed to generate a valid project plan. Missing 'goals' array.");
        }

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
            const tasksToInsert = goal.tasks.map((t: any) => {
                const aiAssignee = typeof t.assigned_to === 'string' ? t.assigned_to : '';
                const fallbackPreferred = preferredAssigneeIds[0];
                const fallbackAny = allowedAssigneeIds[0];
                const resolvedAssignee = allowedAssigneeIds.includes(aiAssignee)
                    ? aiAssignee
                    : (fallbackPreferred || fallbackAny || null);

                return {
                description: t.description,
                estimated_hours: t.estimated_hours,
                assigned_to: resolvedAssignee,
                goal_id: insertedGoal.id,
                org_id: orgId,
                status: 'pending' // Matches database.md default
                };
            });

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

        const rawErrorMessage =
            error instanceof Error
                ? error.message
                : "AI generation failed. Please retry shortly.";
        const errorMessage = rawErrorMessage.includes("Bad Gateway")
            ? "AI provider is temporarily unavailable (Bad Gateway). Please retry in a minute."
            : rawErrorMessage;
        const stack = error instanceof Error ? error.stack : '';
        redirect(`/org/${orgId}/goals?aiError=${encodeURIComponent(errorMessage)}&aiStack=${encodeURIComponent(stack || '')}`);
    }

    revalidatePath(`/org/${orgId}/goals`)
    revalidatePath(`/org/${orgId}/dashboard`)
}

export async function deleteProject(projectId: string, orgId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        console.error("Delete project error:", error);
        throw new Error("Failed to delete project");
    }

    revalidatePath(`/org/${orgId}/goals`);
    revalidatePath(`/org/${orgId}/dashboard`);
}
