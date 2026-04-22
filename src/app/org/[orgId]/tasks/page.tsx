import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/ui/TaskCard";
import { Filter, ArrowUpDown, CheckCircle2, Clock, User, Target, ListFilter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function TasksPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members").select("role").eq("org_id", orgId).eq("user_id", user.id).single();

    const isAdmin = membership?.role === 'admin';

    const { data: tasks } = await supabase
        .from("tasks")
        .select(`
            *,
            structured_goals (
                title,
                projects ( vague_goal_text )
            ),
            assigned_to_profile:profiles!tasks_assigned_to_fkey ( full_name )
        `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

    const { data: members } = await supabase
        .from('organization_members')
        .select(`user_id, profiles(full_name, email)`)
        .eq('org_id', orgId);

    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'To Do', className: 'bg-slate-100 text-slate-600 border-slate-200' },
        in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-600 border-blue-200' },
        done: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-200' },
        blocked: { label: 'Blocked', className: 'bg-red-50 text-red-600 border-red-200' },
    };

    const priorityConfig: Record<string, { label: string; className: string }> = {
        high: { label: 'High Priority', className: 'bg-red-50 text-red-500 border-red-200' },
        medium: { label: 'Medium Priority', className: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        low: { label: 'Low Priority', className: 'bg-slate-50 text-slate-500 border-slate-200' },
    };

    return (
        <div className="p-6 md:p-8 max-w-screen-lg mx-auto animate-in fade-in duration-500">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h1>
                    <p className="text-slate-500 text-sm">Track and manage all team tasks</p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm px-3 py-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase pr-2 border-r border-slate-100">Filter</span>
                    <select className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-slate-600 cursor-pointer">
                        <option>Status: All</option>
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Blocked</option>
                        <option>Completed</option>
                    </select>
                    <select className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-slate-600 cursor-pointer ml-2">
                        <option>Priority: All</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                    <button className="ml-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">
                        <ArrowUpDown className="h-3 w-3" /> Sort
                    </button>
                </div>
            </header>

            {/* Task List — wireframe row style */}
            <div className="space-y-3">
                {tasks && tasks.length > 0 ? tasks.map((task: any, i) => {
                    const status = statusConfig[task.status] ?? statusConfig.pending;
                    const priority = priorityConfig[task.priority ?? 'medium'] ?? priorityConfig.medium;
                    const progress = task.status === 'done' ? 100 : task.status === 'in_progress' ? 55 : task.status === 'blocked' ? 30 : 0;
                    const goalName = task.structured_goals?.projects?.vague_goal_text;

                    return (
                        <div
                            key={task.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex flex-col gap-3">
                                {/* Title row */}
                                <div className="flex flex-wrap items-start gap-2">
                                    <h3 className="text-base font-bold text-slate-900 flex-1 min-w-0">{task.title}</h3>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${status.className} shrink-0`}>
                                        {status.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priority.className} shrink-0`}>
                                        {priority.label}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-500 line-clamp-1">{task.description || "No description."}</p>

                                {/* Goal tag */}
                                {goalName && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                        <Target className="h-3 w-3 text-[#22c55e]" />
                                        <span>Goal: {goalName}</span>
                                    </div>
                                )}

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <User className="h-3.5 w-3.5 text-slate-300" />
                                        <span className="font-semibold">{task.assigned_to_profile?.full_name || "Unassigned"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="h-3.5 w-3.5 text-slate-300" />
                                        <span>0h / {task.estimated_hours ?? 0}h</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto min-w-[120px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'blocked' ? 'bg-red-400' : 'bg-[#22c55e]'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <ListFilter className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-base font-bold text-slate-900">No tasks yet</h3>
                        <p className="text-slate-400 text-sm mt-1">Generate tasks from the Goals page.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
