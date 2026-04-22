import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/ui/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowLeft, CheckCircle2, Clock, Users, Zap } from "lucide-react";
import Link from "next/link";

export default async function GoalDetailPage(props: { params: Promise<{ orgId: string; projectId: string }> }) {
    const { orgId, projectId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members").select("role").eq("org_id", orgId).eq("user_id", user.id).single();
    const isAdmin = membership?.role === 'admin';

    // Fetch the project with its goals and tasks
    const { data: project } = await supabase
        .from("projects")
        .select(`
            *,
            structured_goals (
                id,
                title,
                tasks (
                    *
                )
            )
        `)
        .eq("id", projectId)
        .single();

    if (!project) redirect(`/org/${orgId}/goals`);

    const { data: members } = await supabase
        .from('organization_members')
        .select(`user_id, profiles(full_name, email)`)
        .eq('org_id', orgId);

    const allTasks = project.structured_goals?.flatMap((g: any) => g.tasks) ?? [];
    const completedCount = allTasks.filter((t: any) => t.status === 'done').length;
    const totalCount = allTasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="p-6 md:p-8 max-w-screen-lg mx-auto animate-in fade-in duration-500">
            {/* Back button */}
            <Link
                href={`/org/${orgId}/goals`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Goals
            </Link>

            {/* Goal header */}
            <div className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-2xl shrink-0">
                        <Target className="h-7 w-7 text-[#22c55e]" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.vague_goal_text}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                progress === 100 ? 'bg-green-50 text-green-600 border-green-200' :
                                progress > 60 ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                                {progress === 100 ? '✓ Completed' : progress > 60 ? 'On Track' : 'At Risk'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#22c55e] rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                        { icon: CheckCircle2, label: "Tasks", value: `${completedCount}/${totalCount}` },
                        { icon: Users, label: "Team", value: `${(members || []).length} members` },
                        { icon: Clock, label: "Deadline", value: new Date(new Date(project.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() },
                        { icon: Zap, label: "Velocity", value: `${progress}%` },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2.5">
                            <div className="bg-slate-50 p-1.5 rounded-lg">
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                                <div className="text-sm font-bold text-slate-900">{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tasks grouped by structured goal */}
            <div className="space-y-8">
                {project.structured_goals?.map((goal: any, gi: number) => (
                    <section key={goal.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${gi * 100}ms` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-slate-100" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">{goal.title}</h2>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        {goal.tasks && goal.tasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {goal.tasks.map((task: any) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        isAdmin={isAdmin}
                                        members={members || []}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                No tasks in this sub-goal yet.
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}
