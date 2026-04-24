import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrgShell } from "@/components/OrgShell";
import { unwrapRelation } from "@/lib/supabase/relations";

type OrganizationRelation = {
    name: string;
    join_code: string;
};

export default async function OrgLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members")
        .select("role, organizations(name, join_code)")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    if (!membership) redirect("/workspaces");

    const organization = unwrapRelation<OrganizationRelation>(membership.organizations as OrganizationRelation | OrganizationRelation[] | null);
    const orgName = organization?.name ?? "Workspace";
    const joinCode = organization?.join_code ?? "";

    return (
        <OrgShell orgId={orgId} orgName={orgName} joinCode={joinCode}>
            {children}
        </OrgShell>
    );
}
