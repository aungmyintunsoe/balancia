'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileBasics(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const fullName = (formData.get("fullName") as string | null)?.trim() || null;
    const bio = (formData.get("bio") as string | null)?.trim() || null;
    const mbti = (formData.get("mbti") as string | null)?.trim() || null;
    const bandwidthHoursStr = (formData.get("bandwidthHours") as string | null);
    const bandwidth_hours = bandwidthHoursStr ? parseFloat(bandwidthHoursStr) : null;
    const career_aspiration = (formData.get("careerAspiration") as string | null)?.trim() || null;

    const { error } = await supabase
        .from("profiles")
        .update({ 
            full_name: fullName,
            bio,
            mbti,
            bandwidth_hours,
            career_aspiration
        })
        .eq("id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    // Revalidate workspaces and all org pages where the profile name is shown
    revalidatePath("/workspaces");
    const { data: memberships } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id);
    for (const m of memberships || []) {
        revalidatePath(`/org/${m.org_id}/employees`);
        revalidatePath(`/org/${m.org_id}/dashboard`);
        revalidatePath(`/org/${m.org_id}/analytics`);
        revalidatePath(`/org/${m.org_id}/profile`);
    }
}
