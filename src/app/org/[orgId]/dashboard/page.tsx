import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, ClipboardList, TrendingUp, AlertTriangle, CheckCircle2, User as UserIcon, Bell, Leaf, LayoutGrid } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateTaskStatus } from "@/app/actions/taskActions";
import { AIPivotDialog } from "@/components/ui/dashboard/AIPivotDialog";
import { EmployeeWorkstation } from "@/components/ui/dashboard/EmployeeWorkstation";
import { CopyButton } from "@/components/ui/dashboard/CopyButton";
import Link from "next/link";
import { unwrapRelation } from "@/lib/supabase/relations";

export default async function OrgDashboardPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
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

    console.log("DEBUG: Membership Data:", JSON.stringify(membership, null, 2));

    const isAdmin = membership.role === "admin";
    const orgData = unwrapRelation((membership as any).organizations);
    const orgName = orgData?.name;
    const joinCode = orgData?.join_code;

    // --- AGGREGATE STATS ---
    const { count: activeGoalsCount } = await supabase
        .from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgId);

    const { count: membersCount } = await supabase
        .from('organization_members').select('*', { count: 'exact', head: true }).eq('org_id', orgId);

    const { count: completedTasksCount } = await supabase
        .from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'done');

    const { count: totalTasksCount } = await supabase
        .from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId);

    const productivityScore = totalTasksCount ? Math.round((completedTasksCount! / totalTasksCount) * 100) : 0;

    // --- BLOCKED TASKS (Friction Board) ---
    const { data: blockedTasks } = await supabase
        .from('tasks')
        .select(`*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)`)
        .eq('org_id', orgId)
        .eq('status', 'blocked');

    // --- TOP PERFORMERS ---
    const { data: members } = await supabase
        .from('organization_members')
        .select(`user_id, profiles(full_name, email)`)
        .eq('org_id', orgId);

    const { data: allTasks } = await supabase
        .from('tasks').select('assigned_to, status, estimated_hours').eq('org_id', orgId);

    const { data: recentProjects } = await supabase
        .from('projects')
        .select('vague_goal_text, status, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3);

    const { data: adminNudges } = await supabase
        .from('system_nudges')
        .select(`*, profiles(full_name)`)
        .eq('org_id', orgId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(3);

    const topPerformers = (members || [])
        .map((m: any) => {
            const profile = unwrapRelation(m.profiles);
            const userTasks = allTasks?.filter(t => t.assigned_to === m.user_id) || [];
            const done = userTasks.filter(t => t.status === 'done').length;
            const total = userTasks.length;
            const score = total > 0 ? Math.round((done / total) * 100) : 0;
            return { name: profile?.full_name || profile?.email || 'Unknown', score, done, total };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    // Employee view: my tasks & skills
    let myTasks: any[] = [];
    let mySkills: any[] = [];
    let myProfile: any = null;
    let myRank: number = 0;
    let myNudges: any[] = [];
    let employeeTasksError: any = null;
    if (!isAdmin) {
        const { data: tasks, error } = await supabase.from('tasks').select('*')
            .eq('org_id', orgId).eq('assigned_to', user.id);
        myTasks = tasks || [];
        employeeTasksError = error;

        const { data: skills } = await supabase.from('employee_skills').select('skill_name, proficiency_level')
            .eq('user_id', user.id);
        mySkills = skills || [];

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        myProfile = profile;

        const { data: nudges } = await supabase.from('system_nudges')
            .select('*').eq('user_id', user.id).eq('is_read', false);
        myNudges = nudges || [];

        // Calculate rank based on productivity vs other members
        myRank = topPerformers.findIndex(p => p.name === profile?.full_name || p.name === profile?.email) + 1;
        if (myRank === 0) myRank = topPerformers.length + 1; // Unranked/bottom if not in top performers list or no tasks
    }



    return (
        <div className="p-6 md:p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-md shadow-emerald-100">
                            <Leaf className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-800 uppercase">Balancia Hub</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium italic">"Orchestrating harmony in high-output teams"</p>
                </div>
                
                {isAdmin ? (
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Org Join Code</p>
                            <CopyButton 
                                value={joinCode || "ERROR"} 
                                label={joinCode || "ERROR"}
                                className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-4 py-1.5 rounded-xl font-mono font-black text-sm tracking-widest shadow-sm shadow-emerald-50"
                            />
                        </div>
                        <Link href="/workspaces" className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors mt-1">
                            <LayoutGrid className="h-3.5 w-3.5" /> Switch Workspace
                        </Link>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workstation Mode</p>
                        <p className="text-sm font-black text-emerald-600">Employee Account</p>
                        <Link href="/workspaces" className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors mt-2">
                            <LayoutGrid className="h-3.5 w-3.5" /> Switch Workspace
                        </Link>
                    </div>
                )}
            </header>

            {/* Admin Dashboard View */}
            {isAdmin ? (
                <>
                    {/* Friction Board — only show if blocked tasks exist */}
                    {(blockedTasks?.length ?? 0) > 0 && (
                        <section className="mb-8 space-y-3 animate-in slide-in-from-top-4 duration-500">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" /> SOS — Friction Board
                            </h2>
                            {blockedTasks!.map((task) => (
                                <Alert key={task.id} variant="destructive" className="bg-red-50 border-red-200 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                                            <div>
                                                <AlertTitle className="font-bold text-red-800 flex items-center gap-2 text-sm">
                                                    {task.description}
                                                    <span className="text-[10px] font-normal px-2 py-0.5 bg-red-100 rounded-full flex items-center gap-1 text-red-600">
                                                        <UserIcon className="h-2.5 w-2.5" /> {(task as any).assigned_to_profile?.full_name || "Unassigned"}
                                                    </span>
                                                </AlertTitle>
                                                <AlertDescription className="text-red-700/80 text-xs mt-0.5">
                                                    <span className="font-bold">Blocker:</span> {task.blocker_reason || "No reason provided."}
                                                </AlertDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <AIPivotDialog taskId={task.id} orgId={orgId} taskTitle={task.description} />
                                            <form action={async () => {
                                                'use server';
                                                await updateTaskStatus(task.id, 'in_progress', orgId);
                                            }}>
                                                <Button size="sm" variant="destructive" className="text-xs font-bold whitespace-nowrap">
                                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Resolve
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </Alert>
                            ))}
                        </section>
                    )}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { title: "Active Goals", value: activeGoalsCount ?? 0, sub: "+2 this month", icon: Target, color: "text-[#22c55e]", bg: "bg-green-50" },
                            { title: "Team Members", value: membersCount ?? 0, sub: "3 new line", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                            { title: "Tasks Completed", value: completedTasksCount ?? 0, sub: `+18% vs last month`, icon: ClipboardList, color: "text-purple-500", bg: "bg-purple-50" },
                            { title: "Productivity Score", value: `${productivityScore}%`, sub: "+5% improvement", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
                        ].map(({ title, value, sub, icon: Icon, color, bg }) => (
                            <Card key={title} className="border-none shadow-sm group hover:shadow-md transition-all duration-300 overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 mb-1">{title}</p>
                                            <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>
                                        </div>
                                        <div className={`${bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`h-5 w-5 ${color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-700">Task Completion Breakdown</CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium">Real-time status of all tasks in workspace</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between gap-2 h-40 px-2">
                                    {[
                                        { label: 'To Do', count: (allTasks || []).filter(t => t.status === 'pending').length, color: 'bg-slate-300' },
                                        { label: 'In Prog', count: (allTasks || []).filter(t => t.status === 'in_progress').length, color: 'bg-blue-500' },
                                        { label: 'Blocked', count: (allTasks || []).filter(t => t.status === 'blocked').length, color: 'bg-red-500' },
                                        { label: 'Done', count: (allTasks || []).filter(t => t.status === 'done').length, color: 'bg-[#22c55e]' }
                                    ].map((stat, i) => {
                                        const max = Math.max((allTasks || []).length, 1);
                                        const height = Math.max((stat.count / max) * 100, 5); // min 5% for visibility
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
                                                <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{stat.count}</span>
                                                <div className={`w-full rounded-t-lg ${stat.color} transition-all duration-300 cursor-pointer opacity-80 group-hover:opacity-100`} style={{ height: `${height}%` }} />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-700">Goal Velocity Trend</CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium">Current score: {productivityScore}%</p>
                            </CardHeader>
                            <CardContent>
                                <div className="h-40 flex items-end">
                                    <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d={`M 0,60 L 50,45 L 100,50 L 150,30 L 200,25 L 250,20 L 300,${100 - productivityScore}`} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d={`M 0,60 L 50,45 L 100,50 L 150,30 L 200,25 L 250,20 L 300,${100 - productivityScore} L 300,100 L 0,100 Z`} fill="url(#lineGrad)" />
                                        {[60, 45, 50, 30, 25, 20, 100 - productivityScore].map((p, i) => (
                                            <circle key={i} cx={(i / 6) * 300} cy={p} r="3" fill="#22c55e" />
                                        ))}
                                    </svg>
                                </div>
                                <div className="flex justify-between mt-2">
                                    {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Now'].map(m => <span key={m} className="text-[9px] font-bold text-slate-400">{m}</span>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-slate-400" /> Recent Alerts & Nudges
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(blockedTasks?.length ?? 0) > 0 ? (
                                    blockedTasks!.slice(0, 3).map((task, i) => (
                                        <div key={task.id} className="flex items-start gap-3 group animate-in fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="bg-red-50 p-1.5 rounded-lg mt-0.5">
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{(task as any).assigned_to_profile?.full_name} is blocked on "{task.description}"</p>
                                                <p className="text-[10px] text-slate-400">just now</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        {adminNudges && adminNudges.length > 0 && adminNudges.map((nudge, i) => (
                                            <div key={nudge.id} className="flex items-start gap-3 animate-in fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="bg-blue-50 p-1.5 rounded-lg mt-0.5">
                                                    <Bell className="h-3.5 w-3.5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">Skill Audit Nudge Sent</p>
                                                    <p className="text-[10px] text-slate-400">Sent to {(nudge as any).profiles?.full_name}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {recentProjects && recentProjects.length > 0 ? recentProjects.map((proj, i) => (
                                            <div key={i} className="flex items-start gap-3 animate-in fade-in duration-300" style={{ animationDelay: `${(adminNudges?.length || 0 + i) * 100}ms` }}>
                                                <div className="bg-emerald-50 p-1.5 rounded-lg mt-0.5">
                                                    <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">New Goal: {proj.vague_goal_text}</p>
                                                    <p className="text-[10px] text-slate-400">Created recently</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400 text-center py-4">No recent activity.</p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-slate-400" /> Top Performers This Month
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {topPerformers.length > 0 ? topPerformers.map((p, i) => {
                                    const initials = p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                                    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                                    return (
                                        <div key={i} className="flex items-center gap-3 group animate-in fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className={`${colors[i]} h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>{initials}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-[#22c55e] rounded-full transition-all duration-1000" style={{ width: `${p.score}%` }} />
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-lg font-black text-slate-900">{p.score}%</span>
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-sm text-slate-400 text-center py-4">No task data yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                /* Employee Workstation View */
                <EmployeeWorkstation tasks={myTasks} orgId={orgId} initialSkills={mySkills} profile={myProfile} rank={myRank} nudges={myNudges} />
            )}
        </div>
    );
}
