'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Layout, PlayCircle, ClipboardList, Target, Flame, AlertTriangle } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/taskActions";
import { FrictionModal } from "./FrictionModal";
import { SkillManager } from "./SkillManager";
import { useState } from "react";
import { markNudgeRead } from "@/app/actions/auditActions";
import { useOptiChrome } from "@/components/OptiChromeContext";

interface EmployeeWorkstationProps {
    tasks: any[];
    orgId: string;
    initialSkills: any[];
    profile?: any;
    rank?: number;
    nudges?: any[];
}

export function EmployeeWorkstation({ tasks, orgId, initialSkills, profile, rank, nudges = [] }: EmployeeWorkstationProps) {
    const [localTasks, setLocalTasks] = useState(tasks);
    const [actionError, setActionError] = useState<string | null>(null);
    const { triggerTaskCompleteSpin } = useOptiChrome();

    async function handleStatusUpdate(taskId: string, newStatus: string) {
        const previousTasks = localTasks;
        // Optimistic update
        setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        const result = await updateTaskStatus(taskId, newStatus, orgId);
        if (!result.success) {
            setLocalTasks(previousTasks);
            setActionError(result.error || "Task update failed.");
            return;
        }
        setActionError(null);
        if (newStatus === "done") {
            triggerTaskCompleteSpin();
        }
    }

    const todoTasks = localTasks.filter(t => t.status === 'pending');
    const inProgressTasks = localTasks.filter(t => t.status === 'in_progress');
    const doneTasks = localTasks.filter(t => t.status === 'done');
    const blockedTasks = localTasks.filter(t => t.status === 'blocked');

    const totalHours = localTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
    const completedHours = doneTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
    const activeHours = inProgressTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
    const bandwidth = profile?.bandwidth_hours || 40;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {actionError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {actionError}
                </div>
            )}

            {nudges.map((nudge) => (
                <div key={nudge.id} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-sm animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{nudge.message}</span>
                    </div>
                    <form action={markNudgeRead.bind(null, nudge.id, orgId)}>
                        <Button type="submit" size="sm" variant="outline" className="h-7 text-xs border-blue-200 hover:bg-blue-100 text-blue-700 font-bold">
                            Dismiss
                        </Button>
                    </form>
                </div>
            ))}
            
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Welcome back, {profile?.full_name?.split(' ')[0] || 'Team Member'}</h2>
                    <p className="text-xs text-slate-500 font-medium">Internal Ranking: <span className="font-bold text-[#22c55e]">#{rank}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{activeHours}h / {bandwidth}h</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Current Weekly Load</p>
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1 inline-block">
                        <div className={`h-full rounded-full ${activeHours > bandwidth ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${Math.min((activeHours / bandwidth) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none bg-emerald-50/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-emerald-500 p-2 rounded-xl text-white">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{doneTasks.length}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed This Month</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-blue-50/50 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-500 p-2 rounded-xl text-white">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{completedHours}h</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours Logged</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-white shadow-sm border border-slate-100 overflow-hidden relative">
                    <CardContent className="p-4">
                        <SkillManager initialSkills={initialSkills} orgId={orgId} />
                    </CardContent>
                </Card>
            </div>

            {/* Active Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TO-DO & BLOCKED */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <ClipboardList className="h-3.5 w-3.5" /> Backlog ({todoTasks.length})
                        </h2>
                        <div className="space-y-3">
                            {todoTasks.map((task) => (
                                <TaskItem 
                                    key={task.id} 
                                    task={task} 
                                    onStart={() => handleStatusUpdate(task.id, 'in_progress')}
                                    orgId={orgId}
                                />
                            ))}
                            {todoTasks.length === 0 && <EmptyState text="Clean slate. Nice." />}
                        </div>
                    </div>

                    {blockedTasks.length > 0 && (
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" /> Blocked / Under Review ({blockedTasks.length})
                            </h2>
                            <div className="space-y-3">
                                {blockedTasks.map((task) => (
                                    <TaskItem 
                                        key={task.id} 
                                        task={task} 
                                        orgId={orgId}
                                        isBlocked
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CURRENTLY DOING */}
                <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#22c55e] mb-4 flex items-center gap-2">
                        <PlayCircle className="h-3.5 w-3.5" /> In Flight ({inProgressTasks.length})
                    </h2>
                    <div className="space-y-3">
                        {inProgressTasks.map((task) => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                onDone={() => handleStatusUpdate(task.id, 'done')}
                                orgId={orgId}
                                showSOS
                            />
                        ))}
                        {inProgressTasks.length === 0 && <EmptyState text="No active flight. Pick a task." />}
                    </div>
                </div>
            </div>

            {/* Recent Completion */}
            {doneTasks.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Recently Shipped
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
                        {doneTasks.slice(0, 3).map((task) => (
                            <Card key={task.id} className="border-none bg-slate-50/50">
                                <CardContent className="p-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 truncate mr-2">{task.description}</span>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskItem({ task, onStart, onDone, orgId, isBlocked = false, showSOS = false }: any) {
    return (
        <Card className={`border-none shadow-sm group transition-all duration-300 hover:shadow-md ${isBlocked ? 'bg-red-50/30 ring-1 ring-red-100' : 'bg-white'}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {task.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-slate-300" />}
                            <h4 className="text-sm font-bold text-slate-800 truncate">{task.description}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {task.estimated_hours}h est.
                            </span>
                            {task.status === 'blocked' && (
                                <span className="text-red-400 italic truncate max-w-[200px]">
                                    Reason: {task.blocker_reason}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {showSOS && <FrictionModal taskId={task.id} orgId={orgId} />}
                        
                        {onStart && (
                            <Button size="sm" onClick={onStart} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-[10px] h-8 rounded-xl px-4 shadow-lg shadow-emerald-100">
                                Start Task
                            </Button>
                        )}
                        {onDone && (
                            <Button size="sm" onClick={onDone} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-[10px] h-8 rounded-xl px-4 shadow-lg shadow-emerald-100">
                                Ship it
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="py-8 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{text}</p>
        </div>
    );
}
