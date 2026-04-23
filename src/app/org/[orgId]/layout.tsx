import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
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
        <div className="min-h-screen flex bg-[#f8f8f8]">
            <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <Link
                    href={`/org/${orgId}/dashboard`}
                    className="h-20 px-5 border-b border-slate-200 flex items-center gap-3"
                >
                    <div className="h-10 w-10 rounded-md bg-[#43e400] text-slate-900 flex items-center justify-center font-black">
                        B
                    </div>
                    <span className="text-3xl font-black text-slate-900 leading-none">Balancia</span>
                </Link>

                <div className="p-4 flex-1">
                    <NavLinks orgId={orgId} />
                </div>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {orgName}
                    </div>
                    <Badge variant="outline" className="font-mono tracking-widest text-xs border-[#22c55e] text-[#22c55e]">
                        {joinCode}
                    </Badge>
                    <form action={signOut}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-500 hover:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" /> Sign out
                        </Button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}
