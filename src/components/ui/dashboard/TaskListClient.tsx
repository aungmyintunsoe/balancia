'use client';

import { useState } from "react";
import { Filter, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function TaskListClient({ initialTasks }: { initialTasks: any[] }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'To Do', className: 'bg-slate-100 text-slate-500' },
        in_progress: { label: 'In Progress', className: 'bg-[#bbf7d0] text-[#16a34a]' },
        done: { label: 'Completed', className: 'bg-[#bbf7d0] text-[#16a34a]' },
        blocked: { label: 'Blocked', className: 'bg-red-100 text-red-600' },
    };

    const priorityConfig: Record<string, { label: string; className: string }> = {
        high: { label: 'High Priority', className: 'bg-[#fbcfaebf] text-[#d97746]' },
        medium: { label: 'Medium Priority', className: 'bg-[#fef08a] text-[#ca8a04]' },
        low: { label: 'Low Priority', className: 'bg-slate-100 text-slate-400' },
    };

    // Filter Logic
    let filteredTasks = initialTasks;
    if (statusFilter !== "all") {
        filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
        filteredTasks = filteredTasks.filter(t => (t.priority || "medium") === priorityFilter);
    }

    return (
        <div className="space-y-6">
            {filteredTasks.map((task) => {
                // Progress Calculation
                const estimated = Number(task.estimated_hours) || 1;
                const spent = Number(task.time_spent) || 0;
                let progressPercentage = Math.round((spent / estimated) * 100);
                if (progressPercentage > 100) progressPercentage = 100;
                if (task.status === 'done') progressPercentage = 100;

                const profile = task.assigned_to_profile;
                const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

                return (
                    <div 
                        key={task.id} 
                        className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_-12px_rgba(251,113,133,0.25)] border border-rose-50/50 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(251,113,133,0.4)]"
                    >
                        {/* Header: Title and Badges */}
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                    {task.description}
                                </h3>
                                <p className="text-[13px] text-slate-400 mt-1">
                                    {task.details || "Manage and track the progress of this specific team deliverable."}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Badge variant="secondary" className={`text-[10px] font-bold px-3 py-0.5 rounded-full border-none uppercase tracking-wide ${statusConfig[task.status]?.className || statusConfig.pending.className}`}>
                                    {statusConfig[task.status]?.label || 'To Do'}
                                </Badge>
                                <Badge variant="secondary" className={`text-[10px] font-bold px-3 py-0.5 rounded-full border-none uppercase tracking-wide ${priorityConfig[task.priority]?.className || priorityConfig.medium.className}`}>
                                    {priorityConfig[task.priority]?.label || 'Medium Priority'}
                                </Badge>
                            </div>
                        </div>

                        {/* Project Goal */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-6 mt-3">
                            <CheckCircle2 className="w-4 h-4 text-slate-300" />
                            <span>Goal: {task.structured_goals?.projects?.vague_goal_text || "General Tasks"}</span>
                        </div>

                        <div className="h-px w-full bg-slate-50 mb-5" />

                        {/* Bottom Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
                            
                            {/* User Avatar */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 bg-[#8CE065] text-white shadow-sm border-2 border-white">
                                    <AvatarImage src={profile?.avatar_url} />
                                    <AvatarFallback className="bg-transparent font-bold text-sm">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned to</p>
                                    <p className="text-sm font-bold text-slate-800">{profile?.full_name || "Unassigned"}</p>
                                </div>
                            </div>

                            {/* Time Tracker */}
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-50 p-2 rounded-full">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Spent</p>
                                    <p className="text-sm font-bold text-slate-800">{spent}h / {estimated}h</p>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-50 p-2 rounded-full">
                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : '28/04/2026'}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#8CE065] rounded-full transition-all duration-1000" 
                                        style={{ width: `${progressPercentage}%` }} 
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}