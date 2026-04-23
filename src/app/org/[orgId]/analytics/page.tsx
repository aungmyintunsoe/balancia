import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users, ArrowRight, Clock, CheckCircle2, Shield } from "lucide-react";
import { unwrapRelation } from "@/lib/supabase/relations";

export default async function AnalyticsPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Fetch members with their task loads
    const { data: members } = await supabase
        .from("organization_members")
        .select(`user_id, profiles(full_name, email)`)
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
        const isOverwork = active >= 3 || estimatedHours > 40;
        return {
            name: profile?.full_name || profile?.email || 'Unknown',
            email: profile?.email || '',
            active, done, total, productivity, estimatedHours, isOverwork,
        };
    }).sort((a, b) => (b.isOverwork ? 1 : 0) - (a.isOverwork ? 1 : 0) || b.productivity - a.productivity);

    const atRiskCount = memberStats.filter(m => m.isOverwork).length;
    const avgProductivity = memberStats.length > 0
        ? Math.round(memberStats.reduce((s, m) => s + m.productivity, 0) / memberStats.length)
        : 0;

    return (
        <div className="p-6 md:p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
                <p className="text-slate-500 text-sm">Workload balance and overwork prevention</p>
            </header>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { icon: TrendingUp, label: "Avg Productivity", value: `${avgProductivity}%`, sub: "↑ 8% from last month", color: "text-green-500", bg: "bg-green-50" },
                    { icon: Users, label: "Team Capacity", value: `${memberStats.length} members`, sub: "Workload analysis ready", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: AlertTriangle, label: "Overwork Risk", value: atRiskCount, sub: atRiskCount > 0 ? "Needs immediate attention" : "All balanced ✓", color: atRiskCount > 0 ? "text-red-500" : "text-green-500", bg: atRiskCount > 0 ? "bg-red-50" : "bg-green-50" },
                ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                    <Card key={label} className="border-none shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                <p className={`text-3xl font-black ${atRiskCount > 0 && label === "Overwork Risk" ? "text-red-500" : "text-slate-900"}`}>{value}</p>
                                <p className={`text-[10px] font-medium mt-1 ${color}`}>{sub}</p>
                            </div>
                            <div className={`${bg} p-3 rounded-2xl`}>
                                <Icon className={`h-6 w-6 ${color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overwork Prevention Alerts */}
            {atRiskCount > 0 && (
                <section className="mb-8 space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" /> Overwork Prevention Alerts
                    </h2>
                    {memberStats.filter(m => m.isOverwork).map((m, i) => (
                        <div
                            key={i}
                            className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-400"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-red-100 p-3 rounded-xl shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900 text-base">{m.name}</h3>
                                    <p className="text-sm text-red-700/70 font-medium">
                                        {m.active} active tasks · ~{m.estimatedHours}h estimated this week
                                    </p>
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" className="font-bold shadow-md shadow-red-200 shrink-0">
                                Redistribute Tasks <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </section>
            )}

            {/* Full Team Table */}
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400" /> Team Workload Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {memberStats.map((m, i) => {
                            const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                            const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 animate-in fade-in duration-300 ${m.isOverwork ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50 border-transparent hover:border-slate-100'}`}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    {/* Avatar */}
                                    <div className={`${avatarColors[i % avatarColors.length]} h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                        {initials}
                                    </div>

                                    {/* Name & email */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-900 truncate">{m.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Active</div>
                                            <div className="text-sm font-bold text-slate-900">{m.active}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Done</div>
                                            <div className="text-sm font-bold text-slate-900">{m.done}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Est. Hours</div>
                                            <div className={`text-sm font-bold ${m.isOverwork ? 'text-red-500' : 'text-slate-900'}`}>{m.estimatedHours}h</div>
                                        </div>
                                    </div>

                                    {/* Productivity bar */}
                                    <div className="flex items-center gap-2 min-w-[120px]">
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${m.productivity >= 70 ? 'bg-[#22c55e]' : m.productivity >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                style={{ width: `${m.productivity}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-black text-slate-900 w-10 text-right">{m.productivity}%</span>
                                    </div>

                                    {/* Risk badge */}
                                    {m.isOverwork && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200 shrink-0 animate-pulse">
                                            AT RISK
                                        </span>
                                    )}
                                    {!m.isOverwork && (
                                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                    )}
                                </div>
                            );
                        })}

                        {memberStats.length === 0 && (
                            <div className="py-12 text-center text-slate-400 text-sm">
                                No team members found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
