import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AIPromptBox from "@/components/ui/dashboard/AIPromptBox";
import { Target, Clock, Users, Zap, CheckCircle2, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";
import CopyErrorButton from "@/components/ui/dashboard/CopyErrorButton";
import DeleteGoalButton from "@/components/ui/dashboard/DeleteGoalButton";

export default async function GoalsPage(props: { 
    params: Promise<{ orgId: string }>; 
    searchParams: Promise<{ aiError?: string, aiStack?: string }> 
}) {
    const { orgId } = await props.params;
    const searchParams = await props.searchParams;
    const aiError = searchParams.aiError;
    const aiStack = searchParams.aiStack;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members").select("role").eq("org_id", orgId).eq("user_id", user.id).single();
    const isAdmin = membership?.role === 'admin';

    const { data: projects } = await supabase
        .from("projects")
        .select(`
            *,
            structured_goals (
                id,
                tasks ( id, status )
            )
        `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

    const { data: members } = await supabase
        .from('organization_members').select('user_id').eq('org_id', orgId);

    return (
        <div className="p-6 md:p-8 max-w-screen-lg mx-auto animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set Your Goals</h1>
                <p className="text-slate-500 text-sm">Type in your ideas and we'll help break them into actionable tasks</p>
            </header>

            {aiError && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-xl">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">AI generation failed</p>
                            <p className="mt-1 text-sm text-red-700/90 leading-relaxed">{aiError}</p>
                            <CopyErrorButton error={aiError} stack={aiStack || ''} />
                        </div>
                    </div>
                </div>
            )}

            {/* AI Orchestrator */}
            {isAdmin && (
                <Card className="mb-10 border-none shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-[#22c55e]" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">What do you want to achieve?</CardTitle>
                        <CardDescription className="text-sm">Be as vague or specific as you like. AI will handle the decomposition.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AIPromptBox orgId={orgId} />
                    </CardContent>
                </Card>
            )}

            {/* Active Goals List */}
            <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#22c55e]" /> Active Goals
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Click a goal to view its tasks</p>
                </div>

                {projects && projects.length > 0 ? projects.map((project: any, i: number) => {
                    const allTasks = project.structured_goals?.flatMap((g: any) => g.tasks) ?? [];
                    const completedCount = allTasks.filter((t: any) => t.status === 'done').length;
                    const totalCount = allTasks.length;
                    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    const teamCount = members?.length ?? 0;
                    const deadline = new Date(project.created_at);
                    deadline.setDate(deadline.getDate() + 30);

                    const statusLabel = progress === 100 ? 'Completed' : progress > 60 ? 'On Track' : 'At Risk';
                    const statusStyle = progress === 100
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : progress > 60
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-orange-50 text-orange-600 border-orange-200';

                    return (
                        <div key={project.id} className="relative group">
                            <Link
                                href={`/org/${orgId}/goals/${project.id}`}
                                className="block animate-in fade-in slide-in-from-bottom-4 duration-400"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#22c55e]/30 transition-all duration-300 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="bg-green-50 p-2 rounded-xl shrink-0 group-hover:bg-green-100 transition-colors duration-300">
                                                <Target className="h-5 w-5 text-[#22c55e]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#22c55e] transition-colors duration-300 truncate pr-2">
                                                    {project.vague_goal_text}
                                                </h3>
                                                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <DeleteGoalButton projectId={project.id} orgId={orgId} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-slate-900">{progress}%</span>
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all duration-200" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-5">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#22c55e] rounded-full transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats strip */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { icon: CheckCircle2, label: "Tasks", value: `${completedCount}/${totalCount}` },
                                            { icon: Users, label: "Team", value: `${teamCount} members` },
                                            { icon: Clock, label: "Deadline", value: deadline.toLocaleDateString() },
                                            { icon: Zap, label: "Velocity", value: `${progress}%` },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} className="flex items-center gap-2">
                                                <div className="bg-slate-50 p-1.5 rounded-lg">
                                                    <Icon className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{label}</div>
                                                    <div className="text-xs font-bold text-slate-800">{value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-900">No goals yet</h3>
                        <p className="text-slate-400 text-sm mt-1">Use the orchestrator above to generate your first goal.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
