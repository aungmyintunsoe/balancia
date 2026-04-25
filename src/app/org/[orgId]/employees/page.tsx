import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, BrainCircuit, Briefcase, Mail, Award, AlertTriangle } from "lucide-react";
import { CopyButton } from "@/components/ui/dashboard/CopyButton";
import { unwrapRelation } from "@/lib/supabase/relations";

export default async function EmployeesPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Fetch members with profiles, task counts, and org join code
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
        <div className="p-4 sm:p-6 md:p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500">
            
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Members</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage employee profiles and track performance</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {members.map((member: any, index: number) => {
                    const stats = getMemberStats(member.user_id);
                    const profile = unwrapRelation(member.profiles);
                    const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';
                    const bandwidth = profile?.bandwidth_hours || 40;
                    
                    // Determine status
                    let status = 'Available';
                    if (stats.active > 2) status = 'Busy';
                    if (stats.active === 0 && stats.completed === 0) status = 'Offline';

                    // Determine if over bandwidth
                    const isHighLoad = stats.totalHours > bandwidth;

                    return (
                        <Card 
                            key={member.user_id} 
                            className="rounded-[24px] border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] bg-white overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                            {/* Avatar updated to Lime Green */}
                                            <Avatar className="h-14 w-14 bg-[#8CE065] text-white shadow-sm border-2 border-white">
                                                <AvatarImage src={profile?.avatar_url} />
                                                <AvatarFallback className="bg-transparent font-bold text-lg">{initials}</AvatarFallback>
                                            </Avatar>
                                            
                                            <Badge 
                                                variant="outline" 
                                                className={`text-[10px] font-bold px-3 py-0.5 rounded-full border-none shadow-none uppercase tracking-wide
                                                    ${status === 'Busy' ? 'bg-[#fbcfaebf] text-[#d97746]' : 
                                                      status === 'Available' ? 'bg-[#bbf7d0] text-[#16a34a]' : 
                                                      'bg-slate-100 text-slate-400'}`}
                                            >
                                                {status}
                                            </Badge>
                                        </div>
                                        <div className="pt-1">
                                            <h3 className="text-[17px] font-bold text-slate-900 leading-none mb-1">{profile?.full_name || "Unknown Member"}</h3>
                                            <p className="text-[13px] text-slate-500 mb-1.5 capitalize">{member.role === 'admin' ? 'Manager' : 'Employee'}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                <Mail className="h-3 w-3" /> {profile?.email || 'No email provided'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pt-1">
                                        <div className="text-3xl font-black text-slate-900 leading-none">{stats.productivity}%</div>
                                        <div className="text-[10px] font-medium text-slate-400 mt-1 tracking-wide uppercase">Productivity</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                                            <Clock className="w-3.5 h-3.5" /> Hours/Week
                                        </div>
                                        <div className="text-[22px] font-bold text-slate-900 flex items-center gap-2 leading-none">
                                            {stats.totalHours.toFixed(1)}
                                            {isHighLoad && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                                        </div>
                                        {isHighLoad && <p className="text-[9px] font-black text-red-500 mt-0.5 uppercase">High Load</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                                            <Award className="w-3.5 h-3.5" /> Completed
                                        </div>
                                        <div className="text-[22px] font-bold text-slate-900 leading-none">{stats.completed}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                                            <BrainCircuit className="w-3.5 h-3.5" /> Active Tasks
                                        </div>
                                        <div className="text-[22px] font-bold text-slate-900 leading-none">{stats.active}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[13px] font-medium text-slate-500">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-400">Aspire to:</span>
                                    <span className="text-slate-600">{profile?.career_aspiration || 'No specific role mentioned'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}