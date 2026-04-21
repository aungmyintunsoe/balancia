import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AIPromptBox from "@/components/ui/dashboard/AIPromptBox";
import ActiveProjectsGrid from "@/components/ui/dashboard/ActiveProjectsGrid";

export default async function OrgDashboardPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");


    const { data: membership, error: memError } = await supabase
        .from("organization_members")
        .select("role, organizations(name, join_code)")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();


    if (memError || !membership) {
        redirect("/workspaces");
    }

    const isAdmin = membership.role === "admin";
    const orgName = (membership.organizations as any)?.name;
    const joinCode = (membership.organizations as any)?.join_code;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{orgName} Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {isAdmin ? "Manager" : "Team Member"}</p>
                </div>
            </header>

            <main className="grid gap-6">
                {isAdmin ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        <section className="md:col-span-2 space-y-6">

                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Project Orchestrator</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AIPromptBox orgId={orgId} />
                                </CardContent>
                            </Card>

                            <section className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Active Projects</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ActiveProjectsGrid orgId={orgId} />
                                    </CardContent>
                                </Card>
                            </section>
                        </section>

                        <aside className="space-y-6">

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Workspace Access</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-100 p-4 rounded-lg text-center">
                                        <p className="text-xs uppercase font-bold text-slate-400 mb-1">Join Code</p>
                                        <code className="text-2xl font-mono tracking-widest">{joinCode}</code>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                ) : (
                    <section>
                        <Card>
                            <CardContent className="py-12 text-center">
                                <h2 className="text-xl font-semibold">Welcome to the team!</h2>
                                <p className="text-slate-500">Your manager is currently drafting projects. Stay tuned for your tasks.</p>
                            </CardContent>
                        </Card>
                    </section>
                )}
            </main>
        </div>
    );
}
