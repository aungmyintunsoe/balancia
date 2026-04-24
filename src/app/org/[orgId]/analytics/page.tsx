import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users, Award } from "lucide-react";
import { unwrapRelation } from "@/lib/supabase/relations";
import { redistributeTasks } from "@/app/actions/taskActions";

export default async function AnalyticsPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Fetch members with their task loads
    const { data: members } = await supabase
        .from("organization_members")
        .select(`user_id, profiles(full_name, email, bandwidth_hours)`) 
        .eq("org_id", orgId);

    const { data: tasks } = await supabase
        .from("tasks").select("*").eq("org_id", orgId);

    // Build detailed member stats
    const memberStats = (members || []).map((m: any) => {
        const profile = unwrapRelation(m.profiles);
        const userTasks = tasks?.filter(t => t.assigned_to === m.user_id) || [];
        const active = userTasks.filter(t => t.status === 'in_progress' || t.status === 'blocked').length;
        const done = userTasks.filter(t => t.status === 'done').length;
        const total = userTasks.length;
        const productivity = total > 0 ? Math.round((done / total) * 100) : 0;
        const estimatedHours = userTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        const userCapacity = profile?.bandwidth_hours || 40; 
        const isOverwork = active >= 3 || estimatedHours > userCapacity;
        
        return {
            userId: m.user_id,
            name: profile?.full_name || profile?.email || 'Unknown',
            email: profile?.email || '',
            active, done, total, productivity, estimatedHours, isOverwork, userCapacity
        };
    }).sort((a, b) => (b.isOverwork ? 1 : 0) - (a.isOverwork ? 1 : 0) || b.productivity - a.productivity);

    const atRiskCount = memberStats.filter(m => m.isOverwork).length;
    const avgProductivity = memberStats.length > 0
        ? Math.round(memberStats.reduce((s, m) => s + m.productivity, 0) / memberStats.length)
        : 0;

    // Task Distribution Logic for the Pie Chart Mock
    const allTasks = tasks || [];
    const doneTasks = allTasks.filter(t => t.status === 'done').length;
    const inProgTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const blockedTasks = allTasks.filter(t => t.status === 'blocked').length; // Treating as 'Review' for color mapping
    const totalAllTasks = allTasks.length || 1;

    // Calculate conic gradient percentages for CSS Pie Chart
    const pDone = Math.round((doneTasks / totalAllTasks) * 100);
    const pInProg = Math.round((inProgTasks / totalAllTasks) * 100);
    const pReview = Math.round((blockedTasks / totalAllTasks) * 100);
    
    const conicGradientString = `conic-gradient(
        #4ade80 0% ${pDone}%, 
        #a3e635 ${pDone}% ${pDone + pInProg}%, 
        #a78bfa ${pDone + pInProg}% ${pDone + pInProg + pReview}%, 
        #64748b ${pDone + pInProg + pReview}% 100%
    )`;

    return (
        <div className="p-6 md:p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500 bg-[#fafbfc] min-h-screen">
            
            <header className="mb-8">
                <h1 className="text-[32px] font-bold tracking-tight text-slate-900 leading-tight">Analytics & Insights</h1>
                <p className="text-slate-500 text-[15px] mt-1">Deep dive into team performance and productivity</p>
            </header>

            {/* Top KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* KPI 1 */}
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[13px] font-bold text-slate-500 tracking-wide">Avg Productivity</p>
                            <TrendingUp className="h-5 w-5 text-[#8CE065]" />
                        </div>
                        <p className="text-[40px] font-black text-slate-900 leading-none mb-2">{avgProductivity}%</p>
                        <p className="text-[13px] font-medium text-[#8CE065]">0% from last month</p>
                    </CardContent>
                </Card>

                {/* KPI 2 */}
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[13px] font-bold text-slate-500 tracking-wide">Team Capacity</p>
                            <Users className="h-5 w-5 text-[#8CE065]" />
                        </div>
                        {/* Using 92% as static visual or could map to an actual capacity metric */}
                        <p className="text-[40px] font-black text-slate-900 leading-none mb-2">92%</p>
                        <p className="text-[13px] font-medium text-slate-500">Well balanced workload</p>
                    </CardContent>
                </Card>

                {/* KPI 3 */}
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[13px] font-bold text-slate-500 tracking-wide">Overwork Risk</p>
                            <AlertTriangle className={`h-5 w-5 ${atRiskCount > 0 ? 'text-red-400' : 'text-slate-300'}`} />
                        </div>
                        <p className={`text-[40px] font-black leading-none mb-2 ${atRiskCount > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                            {atRiskCount}
                        </p>
                        <p className={`text-[13px] font-medium ${atRiskCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {atRiskCount > 0 ? "Employees need attention" : "No risks detected"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* Line Chart */}
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px]">
                    <CardContent className="p-8">
                        <h3 className="text-[19px] font-bold text-slate-900 mb-8">Monthly Productivity & Hours Trend</h3>
                        <div className="h-[220px] w-full relative border-b border-slate-100 pb-2">
                            {/* Guidelines */}
                            <div className="absolute left-0 top-0 w-full flex flex-col justify-between h-full pb-8 pointer-events-none">
                                {['100%', '80%', '60%', '40%', '20%', '0%'].map((num, i) => (
                                    <div key={i} className="w-full border-t border-slate-100/80 flex items-center">
                                        <span className="text-[10px] text-slate-400 -translate-y-1/2 -ml-8 w-6 text-right font-medium">{num}</span>
                                    </div>
                                ))}
                            </div>
                            {/* SVG Line Mockup */}
                            <div className="w-full h-full pb-8 relative pt-4 pl-4 z-10">
                                <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <path d="M 0,25 L 50,20 L 100,15 L 150,18 L 200,12 L 250,12" fill="none" stroke="#8CE065" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    {[25, 20, 15, 18, 12, 12].map((p, i) => (
                                        <circle key={i} cx={(i / 5) * 250} cy={p} r="3.5" fill="#8CE065" />
                                    ))}
                                </svg>
                                <div className="absolute bottom-2 w-full flex justify-between pr-4">
                                    {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'April'].map(m => (
                                        <span key={m} className="text-[10px] font-medium text-slate-400">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-[12px] font-medium text-slate-400 mt-6">Tracking productivity score over the last 7 months</p>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px]">
                    <CardContent className="p-8 flex flex-col h-full">
                        <h3 className="text-[19px] font-bold text-slate-900 mb-6">Task Status Distribution</h3>
                        
                        {/* Legend */}
                        <div className="flex justify-center gap-4 mb-6 text-[10px] font-bold text-slate-500">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4ade80]" /> Completed</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#a3e635]" /> In Progress</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Review</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#64748b]" /> To Do</div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                            <div 
                                className="w-48 h-48 rounded-full shadow-inner relative"
                                style={{ background: conicGradientString }}
                            >
                                {/* Center cutout for donut style (optional, removed to match Pic 1 exact pie look) */}
                            </div>
                            
                            {/* Floating Labels (Approximate based on image style) */}
                            {doneTasks > 0 && <span className="absolute bottom-6 right-8 text-[9px] font-bold text-slate-600">Completed<br/>{doneTasks}</span>}
                            {inProgTasks > 0 && <span className="absolute bottom-16 left-6 text-[9px] font-bold text-slate-600 text-right">In Progress<br/>{inProgTasks}</span>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Individual Performance Breakdown */}
            <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-[24px] mb-8 overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="text-[19px] font-bold text-slate-900">Individual Performance Breakdown</h3>
                    </div>
                    
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-8 py-4 text-[12px] font-bold text-slate-900">Employee</th>
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-900 w-[30%]">Productivity Score</th>
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-900">Task Completed</th>
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-900">Weekly Hours</th>
                                    <th className="px-8 py-4 text-[12px] font-bold text-slate-900">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberStats.map((m, i) => {
                                    // Status Badge Logic matching Pic 1
                                    let statusText = "Healthy";
                                    let badgeClass = "bg-[#dcfce7] text-[#16a34a]";
                                    
                                    if (m.isOverwork) {
                                        statusText = "High Load";
                                        badgeClass = "bg-[#fee2e2] text-[#ef4444]";
                                    } else if (m.estimatedHours >= m.userCapacity * 0.9) {
                                        statusText = "Caution";
                                        badgeClass = "bg-[#ffedd5] text-[#ea580c]";
                                    }

                                    return (
                                        <tr key={i} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 flex items-center gap-3">
                                                <Award className="h-4 w-4 text-slate-300" />
                                                <span className="font-bold text-[14px] text-slate-900">
  {m.name.split(' ').map((n: string, i: number) => i === 0 ? n : n[0] + '.').join(' ')}
</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[#8CE065] rounded-full" 
                                                            style={{ width: `${m.productivity}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-[13px] text-slate-900 w-8">{m.productivity}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-[14px] text-slate-600">{m.done}</td>
                                            <td className={`px-6 py-4 font-medium text-[14px] ${m.isOverwork ? 'text-red-400' : 'text-slate-600'}`}>{m.estimatedHours}h</td>
                                            <td className="px-8 py-4 flex items-center gap-2">
                                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badgeClass}`}>
                                                    {statusText}
                                                </span>
                                                {m.isOverwork && <AlertTriangle className="h-4 w-4 text-red-400" />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Overwork Prevention Alerts (Only shows if there are at-risk members) */}
            <div className="bg-[#fcf1ec] rounded-[24px] p-8">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={2.5} />
                    <h2 className="text-[20px] font-bold text-slate-900">Overwork Prevention Alerts</h2>
                </div>

                <div className="space-y-4">
                    {memberStats.filter(m => m.isOverwork).length > 0 ? (
                        memberStats.filter(m => m.isOverwork).map((m, i) => (
                            <div key={i} className="bg-white/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-white">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-[15px] mb-1">{m.name}</h3>
                                    <p className="text-[13px] text-slate-500 font-medium">
                                        Currently at {m.estimatedHours} hours this week (target: {m.userCapacity} hours)
                                    </p>
                                </div>
                                
                                <form action={async () => {
                                    'use server';
                                    await redistributeTasks(orgId, m.userId); 
                                }}>
                                    <Button type="submit" className="bg-[#f07167] hover:bg-[#e06258] text-white font-bold rounded-xl px-6 shadow-sm shadow-red-200 shrink-0 h-10">
                                        Redistribute Tasks
                                    </Button>
                                </form>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/60 rounded-2xl p-6 text-center border border-white">
                            <p className="font-bold text-slate-700">All workloads are currently balanced.</p>
                        </div>
                    )}
                </div>

                <p className="text-[11px] font-medium text-slate-400 mt-6 pt-6 border-t border-red-900/10">
                    The system automatically suggest task redistribution to prevent burnout and maintain healthy work-life balance
                </p>
            </div>
            
        </div>
    );
}