'use client';

import { useState } from "react";
import { Filter, ArrowUpDown, CheckCircle2, Clock, User, Target, ListFilter } from "lucide-react";

export function TaskListClient({ initialTasks }: { initialTasks: any[] }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

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

    let filteredTasks = initialTasks;
    if (statusFilter !== "all") {
        filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
        filteredTasks = filteredTasks.filter(t => (t.priority || "medium") === priorityFilter);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm px-3 py-2 w-fit">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase pr-2 border-r border-slate-100">Filter</span>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-slate-600 cursor-pointer"
                >
                    <option value="all">Status: All</option>
                    <option value="pending">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Completed</option>
                </select>
                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-slate-600 cursor-pointer ml-2"
                >
                    <option value="all">Priority: All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            <div className="space-y-3">
                {filteredTasks.length > 0 ? filteredTasks.map((task: any, i) => {
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
                                    <h3 className="text-base font-bold text-slate-900 flex-1 min-w-0">{task.description}</h3>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${status.className} shrink-0`}>
                                        {status.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priority.className} shrink-0`}>
                                        {priority.label}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-500 line-clamp-1">{task.estimated_hours ? `${task.estimated_hours}h estimated` : "No time estimate."}</p>

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
                        <h3 className="text-base font-bold text-slate-900">No tasks found</h3>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or generate new tasks.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
