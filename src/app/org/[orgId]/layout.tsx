import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, LogOut, Cpu } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";

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

    const orgName = (membership.organizations as any)?.name ?? "Workspace";
    const joinCode = (membership.organizations as any)?.join_code ?? "";

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* ── Top Navbar ── */}
            <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
                <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6 gap-4">

                    {/* Left: Logo + Org Name */}
                    <Link
                        href={`/org/${orgId}/dashboard`}
                        className="flex items-center gap-2 font-bold text-lg shrink-0"
                    >
                        <div className="bg-[#22c55e] text-white p-1.5 rounded-lg">
                            <Cpu className="h-4 w-4" />
                        </div>
                        <span className="text-[#22c55e]">Balancia</span>
                        <span className="text-slate-300 font-light hidden sm:inline">|</span>
                        <span className="text-slate-600 text-sm font-medium hidden sm:inline truncate max-w-[140px]">
                            {orgName}
                        </span>
                    </Link>

                    {/* Center: Nav Links */}
                    <NavLinks orgId={orgId} />

                    {/* Right: Join Code + Sign Out */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge
                            variant="outline"
                            className="font-mono tracking-widest text-xs border-[#22c55e] text-[#22c55e] cursor-pointer
                            hover:bg-green-50 transition-colors hidden sm:flex"
                            title="Click to copy join code"
                        >
                            {joinCode}
                            <Copy className="ml-1.5 h-3 w-3" />
                        </Badge>
                        <form action={signOut}>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                </div>
            </header>

            {/* ── Page Content ── */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
