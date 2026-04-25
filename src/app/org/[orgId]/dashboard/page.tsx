import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
    Target, 
    Users, 
    ClipboardList, 
    AlertTriangle, 
    Award,
    Bell,
    Leaf
} from "lucide-react";
import { updateTaskStatus } from "@/app/actions/taskActions";
import { EmployeeWorkstation } from "@/components/ui/dashboard/EmployeeWorkstation";
import { CopyButton } from "@/components/ui/dashboard/CopyButton";
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

    const isAdmin = membership.role === "admin";
    const orgData = unwrapRelation((membership as any).organizations);
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

    // --- BLOCKED TASKS & NUDGES ---
    const { data: blockedTasks } = await supabase
        .from('tasks')
        .select(`*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)`)
        .eq('org_id', orgId)
        .eq('status', 'blocked');

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

    // --- TASK BREAKDOWN & TOP PERFORMERS ---
    const { data: members } = await supabase
        .from('organization_members')
        .select(`user_id, profiles(full_name, email)`)
        .eq('org_id', orgId);

    const { data: allTasks } = await supabase
        .from('tasks').select('assigned_to, status, estimated_hours').eq('org_id', orgId);

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
    
    if (!isAdmin) {
        const { data: tasks } = await supabase.from('tasks').select('*').eq('org_id', orgId).eq('assigned_to', user.id);
        myTasks = tasks || [];
        const { data: skills } = await supabase.from('employee_skills').select('skill_name, proficiency_level').eq('user_id', user.id);
        mySkills = skills || [];
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        myProfile = profile;
        const { data: nudges } = await supabase.from('system_nudges').select('*').eq('user_id', user.id).eq('is_read', false);
        myNudges = nudges || [];

        myRank = topPerformers.findIndex(p => p.name === profile?.full_name || p.name === profile?.email) + 1;
        if (myRank === 0) myRank = topPerformers.length + 1; 
    }

    return (
        <div className="w-full min-h-screen bg-[#fafbfc] font-sans p-4 sm:p-6 lg:p-10 animate-in fade-in duration-500">
            
            <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-bold text-slate-900 tracking-tight mb-1">Dashboard</h1>
                    <p className="text-slate-500 text-sm font-medium">Overview of team productivity and goals</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Join Code</span>
                        <CopyButton 
                            value={joinCode || "ERROR"} 
                            label={joinCode || "ERROR"}
                            className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-1.5 rounded-xl font-mono font-bold text-sm"
                        />
                    </div>
                )}
            </header>

            {isAdmin ? (
                <>
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        {[
                            { title: "Active Goals", value: activeGoalsCount ?? 0, sub: "+2 this month", icon: Target, color: "text-[#8CE065]", bg: "bg-[#8CE065]/10" },
                            { title: "Team Members", value: membersCount ?? 0, sub: "3 new line", icon: Users, color: "text-[#8CE065]", bg: "bg-[#8CE065]/10" },
                            { title: "Tasks Completed", value: completedTasksCount ?? 0, sub: "+18% vs last month", icon: ClipboardList, color: "text-purple-400", bg: "bg-purple-100/50" },
                            { title: "Productivity Score", value: `${productivityScore}%`, sub: "+5% improvement", icon: Target, color: "text-orange-400", bg: "bg-orange-100/50" },
                        ].map(({ title, value, sub, icon: Icon, color, bg }) => (
                            <div key={title} className="bg-white p-6 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
                                <div className={`${bg} h-12 w-12 rounded-2xl flex items-center justify-center mb-6`}>
                                    <Icon className={`h-6 w-6 ${color}`} strokeWidth={2} />
                                </div>
                                <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
                                <p className="text-[32px] font-black text-slate-900 leading-tight mb-2">{value}</p>
                                <p className="text-xs font-medium text-slate-400">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        
                        {/* Task Completion Breakdown */}
                        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Task Completion Breakdown</h3>
                            <p className="text-[11px] text-slate-400 font-medium mb-8">Real-time status of all tasks in workspace</p>
                            
                            <div className="h-[190px] flex items-end justify-between gap-3 px-2 relative border-b border-slate-100 pb-2">
                                {[
                                    { label: 'To Do', count: (allTasks || []).filter(t => t.status === 'pending').length, color: 'bg-slate-200' },
                                    { label: 'In Prog', count: (allTasks || []).filter(t => t.status === 'in_progress').length, color: 'bg-blue-400' },
                                    { label: 'Blocked', count: (allTasks || []).filter(t => t.status === 'blocked').length, color: 'bg-red-400' },
                                    { label: 'Done', count: (allTasks || []).filter(t => t.status === 'done').length, color: 'bg-[#8CE065]' }
                                ].map((stat, i) => {
                                    const max = Math.max((allTasks || []).length, 1);
                                    const height = Math.max((stat.count / max) * 100, 5); // min 5% for visibility
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 z-10 group">
                                            <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{stat.count}</span>
                                            <div className={`w-full max-w-[48px] ${stat.color} rounded-t-lg transition-all duration-500 opacity-90 group-hover:opacity-100`} style={{ height: `${height}%` }} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Goal Velocity Trend (Dynamic) */}
                        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Goal Velocity Trend</h3>
                            <p className="text-[11px] text-slate-400 font-medium mb-8">Current score: {productivityScore}%</p>
                            
                            <div className="h-[190px] w-full relative border-b border-slate-100 pb-2">
                                {/* Horizontal Guidelines */}
                                <div className="absolute left-0 top-0 w-full flex flex-col justify-between h-full pb-8 pointer-events-none">
                                    {['100%', '80%', '60%', '40%', '20%', '0%'].map((num, i) => (
                                        <div key={i} className="w-full border-t border-slate-100/80 flex items-center">
                                            <span className="text-[10px] text-slate-400 -translate-y-1/2 -ml-8 w-6 text-right">{num}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* SVG Line - Dynamically linked to productivityScore */}
                                <div className="w-full h-full pb-8 relative pt-4 pl-4 z-10">
                                    <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8CE065" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#8CE065" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {/* Dynamic path: The last point uses 100 - productivityScore (since 0 is top of SVG) */}
                                        <path d={`M 0,60 L 50,45 L 100,50 L 150,30 L 200,25 L 250,20 L 300,${Math.max(0, 100 - productivityScore)}`} fill="none" stroke="#8CE065" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d={`M 0,60 L 50,45 L 100,50 L 150,30 L 200,25 L 250,20 L 300,${Math.max(0, 100 - productivityScore)} L 300,100 L 0,100 Z`} fill="url(#lineGrad)" />
                                        
                                        {[60, 45, 50, 30, 25, 20, Math.max(0, 100 - productivityScore)].map((p, i) => (
                                            <circle key={i} cx={(i / 6) * 300} cy={p} r="4" fill="#8CE065" stroke="white" strokeWidth="2" />
                                        ))}
                                    </svg>
                                    {/* X Axis Labels */}
                                    <div className="absolute bottom-2 w-full flex justify-between pr-4">
                                        {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Now'].map(m => (
                                            <span key={m} className="text-[10px] font-bold text-slate-400">{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Real Alerts & Nudges List */}
                        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Alerts & Nudges</h3>
                            <div className="space-y-4">
                                
                                {/* 1. Blocked Tasks (High Priority) */}
                                {blockedTasks?.slice(0, 2).map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[16px] shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-red-50 p-2 rounded-full">
                                                <AlertTriangle className="h-5 w-5 text-red-500 stroke-[2]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{(task as any).assigned_to_profile?.full_name} is blocked</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{task.description}</p>
                                            </div>
                                        </div>
                                        <form action={async () => {
                                            'use server';
                                            await updateTaskStatus(task.id, 'in_progress', orgId);
                                        }}>
                                            <Button size="sm" variant="outline" className="text-xs font-bold text-slate-600 hover:text-[#8CE065] hover:border-[#8CE065]">
                                                Resolve
                                            </Button>
                                        </form>
                                    </div>
                                ))}

                                {/* 2. Admin Nudges */}
                                {adminNudges?.map((nudge) => (
                                    <div key={nudge.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[16px] shadow-sm">
                                        <div className="bg-blue-50 p-2 rounded-full">
                                            <Bell className="h-5 w-5 text-blue-500 stroke-[2]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Skill Audit Nudge Sent</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sent to {(nudge as any).profiles?.full_name}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* 3. Recent Projects/Goals */}
                                {recentProjects?.map((proj, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[16px] shadow-sm">
                                        <div className="bg-[#8CE065]/10 p-2 rounded-full">
                                            <Leaf className="h-5 w-5 text-[#8CE065] stroke-[2]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">New Goal: {proj.vague_goal_text}</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Created recently</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty State Fallback */}
                                {(!blockedTasks?.length && !adminNudges?.length && !recentProjects?.length) && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                                            <Bell className="h-6 w-6 text-slate-300 stroke-[1.5]" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">No recent activity</p>
                                        <p className="text-xs text-slate-400 mt-1">Check back later for updates.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Performers List (with Progress Bars) */}
                        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performers This Month</h3>
                            <div className="space-y-6">
                                {topPerformers.length > 0 ? topPerformers.map((p, i) => {
                                    const initials = p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                    // Assign different colors based on rank just like in the original pic
                                    const badgeColors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className={`${badgeColors[i % badgeColors.length]} h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                                                {initials}
                                            </div>
                                            
                                            {/* Name & Progress Bar */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div className="h-full bg-[#8CE065] rounded-full transition-all duration-1000" style={{ width: `${p.score}%` }} />
                                                </div>
                                            </div>
                                            
                                            {/* Score */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-lg font-black text-slate-900">{p.score}%</span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-10 text-slate-400 font-medium">
                                        No task data available yet to rank performers.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            ) : (
                /* Employee Workstation View */
                <div className="bg-white rounded-[24px] shadow-sm p-6 border border-slate-50">
                    <EmployeeWorkstation tasks={myTasks} orgId={orgId} initialSkills={mySkills} profile={myProfile} rank={myRank} nudges={myNudges} />
                </div>
            )}
        </div>
    );
}