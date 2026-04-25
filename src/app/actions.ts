'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateText } from "ai"
import { ilmu, ILMU_MODEL } from "../lib/ilmu"
import { ORCHESTRATION_AI_TIMEOUT_MS, ORCHESTRATION_GOAL_MAX_CHARS } from "../lib/orchestration-limits"
import { buildChunkedTeamRosterContext } from "../lib/context-chunking"

function isAbortLikeError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === "AbortError") return true
    if (error instanceof Error && error.name === "AbortError") return true
    const msg = error instanceof Error ? error.message.toLowerCase() : ""
    return msg.includes("abort") || msg.includes("aborted") || msg.includes("signal has been aborted")
}

type TeamMember = {
    user_id: string;
    role: 'admin' | 'employee';
    profiles?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null;
};

export async function generateProject(formData: FormData) {
    const supabase = await createClient()

    const orgId = formData.get('orgId') as string
    const vagueGoalText = ((formData.get('vagueGoalText') as string) ?? '').trim()

    if (!vagueGoalText) {
        redirect(`/org/${orgId}/goals?aiError=${encodeURIComponent('Please enter a project goal.')}`)
    }
    if (vagueGoalText.length > ORCHESTRATION_GOAL_MAX_CHARS) {
        redirect(
            `/org/${orgId}/goals?aiError=${encodeURIComponent(`Project goal must be ${ORCHESTRATION_GOAL_MAX_CHARS} characters or fewer.`)}`,
        )
    }

    // 1. Context Gathering: Fetch team roster (gracefully handle missing skills table)
    let teamData: TeamMember[] = [];
    const { data: { user } } = await supabase.auth.getUser();

    try {
        // Fetch all org members — using service-level select via RLS-safe approach
        const { data: membersData, error: teamError } = await supabase
            .from('organization_members')
            .select(`
                user_id,
                role,
                profiles (
                    full_name,
                    email
                )
            `)
            .eq('org_id', orgId);

        if (!teamError && membersData && membersData.length > 0) {
            teamData = (membersData ?? []) as TeamMember[];
            console.log(`DEBUG: Found ${teamData.length} members. Roles: ${teamData.map(m => m.role).join(', ')}`);
        } else {
            teamData = user?.id ? [{ user_id: user.id, role: 'admin' }] : [];
            console.log("DEBUG: No team found, falling back to current user.");
        }
    } catch (e) {
        console.error("DEBUG: Team Fetch Error:", e);
        teamData = user?.id ? [{ user_id: user.id, role: 'admin' }] : [];
    }

    // Fetch skills for all team members in one query
    const memberIds = teamData.map(m => m.user_id);
    const { data: allSkills } = await supabase
        .from('employee_skills')
        .select('user_id, skill_name, proficiency_level')
        .in('user_id', memberIds);

    // Build a lookup map: user_id -> skills[]
    const skillsByUser: Record<string, { skill_name: string; proficiency_level: number }[]> = {};
    for (const skill of allSkills ?? []) {
        if (!skillsByUser[skill.user_id]) skillsByUser[skill.user_id] = [];
        skillsByUser[skill.user_id].push({ skill_name: skill.skill_name, proficiency_level: skill.proficiency_level });
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
            skills: skillsByUser[member.user_id] ?? [],
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

        // 3. The AI Call: Using 'Opti' the AI Tech Lead (bounded wait — SDK aborts the HTTP request)
        const abortController = new AbortController()
        const abortTimer = setTimeout(() => abortController.abort(), ORCHESTRATION_AI_TIMEOUT_MS)

        let text: string
        try {
            const result = await generateText({
            model: ilmu.chat(ILMU_MODEL),
            abortSignal: abortController.signal,
            system: `You are 'Opti', an AI Tech Lead. Break the user's project goal into 2-3 structured goals, and 2-4 micro-tasks per goal. 
            
            DISTRIBUTION RULES:
            1. You MUST assign each task to a specific user ID from the provided team roster.
            2. Match the task requirements to the 'employee_skills' listed for each user.
            3. Prioritize 'proficiency_level' (1-5) when multiple users have the same skill.
            4. Balance the workload—do not assign all tasks to one person if others are available.
            5. If no one has the exact skill, assign to the most versatile member.
            6. CRITICAL: You MUST prioritize assigning tasks to users listed in "preferred_assignee_ids" (these are the employees). NEVER assign to an admin unless absolutely no employee is available.
            7. Use the person's display_name + skills for reasoning. If no skills are present, distribute the tasks evenly among the "preferred_assignee_ids".

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
            ${buildChunkedTeamRosterContext(aiRoster)}

            Preferred assignee IDs:
            ${JSON.stringify(preferredAssigneeIds, null, 2)}

            Allowed assignee IDs:
            ${JSON.stringify(allowedAssigneeIds, null, 2)}
            
            Generate the structured roadmap based on the team's specific skills.`,
            })
            text = result.text
        } finally {
            clearTimeout(abortTimer)
        }

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
        const timedOut = isAbortLikeError(error)
        const errorMessage = timedOut
            ? "The AI did not respond in time and may be unavailable right now. Please try again in a moment."
            : rawErrorMessage.includes("Bad Gateway")
              ? "AI provider is temporarily unavailable (Bad Gateway). Please retry in a minute."
              : rawErrorMessage;
        const stack =
            timedOut ? "" : error instanceof Error ? error.stack ?? "" : "";
        redirect(`/org/${orgId}/goals?aiError=${encodeURIComponent(errorMessage)}&aiStack=${encodeURIComponent(stack)}`);
    }

    revalidatePath(`/org/${orgId}/goals`)
    revalidatePath(`/org/${orgId}/dashboard`)
    revalidatePath(`/org/${orgId}/tasks`)
    revalidatePath(`/org/${orgId}/analytics`)
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
