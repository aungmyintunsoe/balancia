'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function runSkillAudit(orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Find a random employee in the org to nudge
    const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("org_id", orgId)
        .eq("role", "employee");

    if (!members || members.length === 0) {
        return { success: false, error: "No employees to audit." };
    }

    // Pick a random employee
    const randomEmployee = members[Math.floor(Math.random() * members.length)];

    // Insert a nudge
    const { error } = await supabase
        .from("system_nudges")
        .insert({
            org_id: orgId,
            user_id: randomEmployee.user_id,
            message: "AI indicates you might have unlisted skills required for pending tasks. Please update your skill profile!"
        });

    if (error) {
        console.error("Failed to create nudge:", error);
        return { success: false, error: "Audit failed to trigger." };
    }

    revalidatePath(`/org/${orgId}/analytics`);
    revalidatePath(`/org/${orgId}/dashboard`);
    return { success: true };
}

export async function markNudgeRead(nudgeId: string, orgId: string) {
    const supabase = await createClient();
    await supabase.from("system_nudges").update({ is_read: true }).eq("id", nudgeId);
    revalidatePath(`/org/${orgId}/dashboard`);
}
