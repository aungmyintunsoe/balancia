import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Clock, CheckCircle2, BrainCircuit } from "lucide-react";
import { CopyButton } from "@/components/ui/dashboard/CopyButton";
import { unwrapRelation } from "@/lib/supabase/relations";

export default async function EmployeesPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Fetch members with profiles, task counts, and the org join code
    const { data: membersData, error } = await supabase
        .from("organization_members")
        .select(`
            role,
            user_id,
            organizations ( join_code ),
            profiles (
                full_name,
                email,
                avatar_url,
                career_aspiration,
                bandwidth_hours
            )
        `)
        .eq("org_id", orgId);

    if (error || !membersData) redirect("/workspaces");

    const members = membersData || [];
    const firstOrg = unwrapRelation((members[0] as any)?.organizations);
    const joinCode = firstOrg?.join_code || "UNKNOWN";

    // Fetch task stats for everyone to calculate productivity
    const { data: tasks } = await supabase
        .from("tasks")
        .select("assigned_to, status, estimated_hours")
        .eq("org_id", orgId);

    const getMemberStats = (userId: string) => {
        const userTasks = tasks?.filter(t => t.assigned_to === userId) || [];
        const completed = userTasks.filter(t => t.status === 'done').length;
        const total = userTasks.length;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
        const totalHours = userTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
        return { completed, total, productivity, totalHours, active: total - completed };
    };

    return (
        <div className="p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Members</h1>
                    <p className="text-slate-500 text-sm">Manage employee profiles and track performance</p>
                </div>
                <div className="flex items-center gap-3">
                     <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Org Join Code</p>
                            <code className="text-sm font-mono font-black text-slate-700 tracking-widest uppercase">
                                {joinCode}
                            </code>
                        </div>
                        <CopyButton value={joinCode} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {members.map((member: any) => {
                    const stats = getMemberStats(member.user_id);
                    const profile = unwrapRelation(member.profiles);
                    const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || '??';
                    
                    const status = stats.active > 2 ? 'Busy' : 'Available';
                    const hours = `${stats.totalHours.toFixed(1)} / ${profile?.bandwidth_hours || 40}`;

                    return (
                        <Card key={member.user_id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4">
                                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-sm">
                                                <AvatarImage src={profile?.avatar_url} />
                                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xl">{initials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-xl font-bold">{profile?.full_name || "Unknown Member"}</h3>
                                                <p className="text-xs text-slate-400 font-medium mb-2">{member.role.toUpperCase()}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0 ${status === 'Busy' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                        {status}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-300 font-medium">{profile?.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-slate-900 leading-none">{stats.productivity}%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Productivity</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                <Clock className="w-3 h-3" /> Hours/Week
                                            </div>
                                            <div className="text-lg font-bold">{hours}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Completed
                                            </div>
                                            <div className="text-lg font-bold">{stats.completed}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                <BrainCircuit className="w-3 h-3" /> Active
                                            </div>
                                            <div className="text-lg font-bold">{stats.active}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <div className="bg-slate-100 p-1.5 rounded-md">
                                            <UserPlus className="h-3 w-3" />
                                        </div>
                                        Aspire to: {profile?.career_aspiration || 'No specific role mentioned'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
