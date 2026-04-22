'use client';

import { useState, useTransition } from "react";
import { updateTaskStatus, reportFriction } from "@/app/actions/taskActions";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Play, Loader2, Clock, BarChart } from "lucide-react";
import { AssigneeSelector } from "@/components/AssigneeSelector";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'done' | 'blocked';
    assigned_to?: string | null;
    blocker_reason?: string | null;
    estimated_hours?: number | null;
}

interface TaskCardProps {
    task: Task;
    isAdmin?: boolean; 
    members?: any[];   
}

export function TaskCard({ task, isAdmin, members }: TaskCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [blockerReason, setBlockerReason] = useState("");
    const params = useParams();
    const orgId = params.orgId as string;

    const handleStart = () => {
        startTransition(async () => {
            await updateTaskStatus(task.id, 'in_progress', orgId);
        });
    };

    const handleComplete = () => {
        startTransition(async () => {
            await updateTaskStatus(task.id, 'done', orgId);
        });
    };

    const submitSOS = () => {
        if (!blockerReason.trim()) return;
        startTransition(async () => {
            await reportFriction(task.id, blockerReason, orgId);
            setIsSOSOpen(false);
            setBlockerReason("");
        });
    };

    const statusStyles = {
        pending: "bg-slate-100 text-slate-600 border-slate-200",
        in_progress: "bg-blue-50 text-blue-600 border-blue-200",
        done: "bg-emerald-50 text-emerald-600 border-emerald-200",
        blocked: "bg-red-50 text-red-600 border-red-200 animate-pulse",
    };

    // Calculate a mock progress based on status for the UI "Wow" factor
    const progress = task.status === 'done' ? 100 : task.status === 'in_progress' ? 45 : task.status === 'blocked' ? 30 : 0;

    return (
        <>
            <Card className={`w-full shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 ${isPending ? 'opacity-60 grayscale' : ''}`}>
                <div className={`h-1 w-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : task.status === 'blocked' ? 'bg-red-500' : 'bg-slate-200'}`} />
                
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`${statusStyles[task.status]} font-bold uppercase text-[10px] tracking-wider px-2 py-0`}>
                            {task.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <Clock className="w-3 h-3 mr-1" /> {task.estimated_hours || 0}H EST
                        </div>
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs pt-1">
                        {task.description || "No description provided."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                    {/* Progress Bar (Balancia Style) */}
                    <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${task.status === 'done' ? 'bg-emerald-500' : 'bg-[#22c55e]'}`} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>

                    {task.status === 'blocked' && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-medium italic mb-4">
                            " {task.blocker_reason} "
                        </div>
                    )}

                    {isAdmin && members && (
                        <AssigneeSelector 
                            taskId={task.id} 
                            orgId={orgId} 
                            members={members} 
                            currentAssigneeId={task.assigned_to} 
                        />
                    )}
                </CardContent>

                <CardFooter className="flex gap-2 pt-4 border-t bg-slate-50/30">
                    {task.status !== 'done' && (
                        <>
                            {task.status === 'pending' && (
                                <Button onClick={handleStart} variant="outline" size="sm" className="flex-1 text-xs font-bold uppercase tracking-wider">
                                    <Play className="w-3 h-3 mr-2 fill-current" /> Start
                                </Button>
                            )}
                            {task.status === 'in_progress' && (
                                <Button onClick={handleComplete} variant="outline" size="sm" className="flex-1 text-xs font-bold uppercase tracking-wider text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                    <CheckCircle2 className="w-3 h-3 mr-2" /> Finish
                                </Button>
                            )}
                            <Button 
                                onClick={() => setIsSOSOpen(true)} 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-xs font-bold uppercase tracking-wider text-red-500 border-red-100 hover:bg-red-50"
                            >
                                <AlertCircle className="w-3 h-3 mr-2" /> SOS
                            </Button>
                        </>
                    )}
                    {task.status === 'done' && (
                        <div className="w-full flex items-center justify-center py-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3 mr-2" /> Task Completed
                        </div>
                    )}
                </CardFooter>
            </Card>

            {/* SOS Dialog */}
            <Dialog open={isSOSOpen} onOpenChange={setIsSOSOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" /> Report Blocker
                        </DialogTitle>
                        <DialogDescription>
                            What's preventing you from finishing this task? Your manager will be notified immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="I need access to the production server..." 
                            value={blockerReason}
                            onChange={(e) => setBlockerReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSOSOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitSOS} disabled={isPending || !blockerReason.trim()}>
                            {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                            Send SOS
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

