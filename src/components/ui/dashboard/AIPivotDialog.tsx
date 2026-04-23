"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, UserPlus, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { generatePivotStrategy, assignTask } from "../../../app/actions/taskActions";
import { Badge } from "@/components/ui/badge";
import CopyErrorButton from "./CopyErrorButton";

interface PivotRecommendation {
    recommended_user_id: string;
    recommended_user_name: string;
    reasoning: string;
}

export function AIPivotDialog({ taskId, orgId, taskTitle }: { taskId: string, orgId: string, taskTitle: string }) {
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [recommendation, setRecommendation] = useState<PivotRecommendation | null>(null);
    const [error, setError] = useState<{ message: string, stack?: string } | null>(null);
    const [open, setOpen] = useState(false);

    async function handleGetStrategy() {
        setLoading(true);
        setError(null);
        const result = await generatePivotStrategy(taskId, orgId);
        if (result.success && result.recommendation) {
            setRecommendation(result.recommendation as PivotRecommendation);
        } else {
            setError({ message: result.error || "An unknown error occurred", stack: (result as any).stack });
        }
        setLoading(false);
    }

    async function handleApply() {
        if (!recommendation) return;
        setApplying(true);
        setError(null);
        const result = await assignTask(taskId, recommendation.recommended_user_id, orgId);
        if (result.success) {
            setOpen(false);
            setRecommendation(null);
        } else {
            setError({ message: result.error || "Unable to apply reassignment." });
        }
        setApplying(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                        if (!recommendation) handleGetStrategy();
                    }}
                >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Strategy
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        AI Pivot Strategy
                    </DialogTitle>
                    <DialogDescription>
                        Resolving friction for: <span className="font-bold text-slate-900">{taskTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium text-slate-500 italic">Opti is analyzing team workload & skills...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-red-900">AI Pivot Failed</p>
                                    <p className="text-xs text-red-800/80 leading-relaxed">
                                        {error.message}
                                    </p>
                                    <CopyErrorButton error={error.message} stack={error.stack || ''} />
                                    <Button
                                        variant="link"
                                        onClick={handleGetStrategy}
                                        className="p-0 h-auto text-xs text-red-600 font-bold mt-2"
                                    >
                                        Try again
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : recommendation ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended New Assignee</span>
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                                        Skill Match 98%
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                        {recommendation.recommended_user_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{recommendation.recommended_user_name}</p>
                                        <p className="text-[10px] text-slate-500">Selected based on availability & skills</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                                <Info className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-emerald-900">Why this pivot?</p>
                                    <p className="text-xs text-emerald-800 leading-relaxed">
                                        {recommendation.reasoning}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-slate-500">Something went wrong. Please try again.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-xs">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={applying || !recommendation}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                    >
                        {applying ? (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Reassigning...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-3.5 w-3.5" />
                                Execute Transfer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
