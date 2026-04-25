import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIPromptBox from "@/components/ui/dashboard/AIPromptBox";
import { Target, Clock, Users, Zap, CheckCircle2, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";
import CopyErrorButton from "@/components/ui/dashboard/CopyErrorButton";
import DeleteGoalButton from "@/components/ui/dashboard/DeleteGoalButton";
import { GoalsListWithGeneratingSlot } from "@/components/GoalsListWithGeneratingSlot";

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
        <div className="p-4 sm:p-8 md:p-12 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Set Your Goals</h1>
                <p className="text-slate-500 text-lg font-medium">Type in your ideas and we'll help break them into actionable tasks</p>
            </div>

            {aiError && (
                <div className="mb-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
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

            {/* AI Orchestrator Card */}
            {isAdmin && (
                <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-16 relative overflow-hidden">
                    {/* The green accent bar at the top */}
                    <div className="absolute top-0 left-8 right-8 h-1.5 bg-[#43e400] rounded-b-xl" />
                    
                    <div className="mb-6 mt-2">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What do you want to achieve?</h2>
                        <p className="text-slate-500 text-base mt-1">Be as vague or specific as you like. AI will handle the decomposition.</p>
                    </div>
                    
                    {/* We keep your AIPromptBox intact because it handles the DB logic! */}
                    <AIPromptBox orgId={orgId} />
                </div>
            )}

            {/* Active Goals List */}
            <section className="space-y-6">
                <div className="flex items-end justify-between mb-6 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <Target className="h-5 w-5 text-[#22c55e]" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Goals</h2>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pb-2">Click a goal to view its tasks</p>
                </div>

                <GoalsListWithGeneratingSlot
                    isAdmin={isAdmin}
                    hasProjects={Boolean(projects && projects.length > 0)}
                >
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
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[#22c55e]/30 transition-all duration-300 p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="bg-green-50 p-3 rounded-2xl shrink-0 group-hover:bg-green-100 transition-colors duration-300">
                                                <Target className="h-6 w-6 text-[#22c55e]" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                                <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-[#22c55e] transition-colors duration-300 truncate">
                                                    {project.vague_goal_text}
                                                </h3>
                                                <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border ${statusStyle} shrink-0`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <DeleteGoalButton projectId={project.id} orgId={orgId} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-slate-900">{progress}%</span>
                                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#22c55e] group-hover:translate-x-1 transition-all duration-200" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-6">
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#43e400] rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats strip */}
                                    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 pt-2">
                                        {[
                                            { icon: CheckCircle2, label: "Tasks", value: `${completedCount}/${totalCount}` },
                                            { icon: Users, label: "Team", value: `${teamCount} members` },
                                            { icon: Clock, label: "Deadline", value: deadline.toLocaleDateString() },
                                            { icon: Zap, label: "Velocity", value: `${progress}%` },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} className="flex items-center gap-3">
                                                <div className="bg-slate-50 p-2 rounded-xl">
                                                    <Icon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                                                    <div className="text-sm font-bold text-slate-800">{value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                }) : (
                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <Target className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No goals yet</h3>
                        <p className="text-slate-500 text-base mt-1">Use the orchestrator above to generate your first goal.</p>
                    </div>
                )}
                </GoalsListWithGeneratingSlot>
            </section>
        </div>
    );
}