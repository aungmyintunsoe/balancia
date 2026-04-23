'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { reportFriction } from "@/app/actions/taskActions";

interface FrictionModalProps {
    taskId: string;
    orgId: string;
}

export function FrictionModal({ taskId, orgId }: FrictionModalProps) {
    const [open, setOpen] = useState(false);
    const [complaint, setComplaint] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!complaint.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const result = await reportFriction(taskId, complaint, orgId);
            if (result.success) {
                setOpen(false);
                setComplaint("");
                return;
            }
            setError(result.error || "Unable to report blocker.");
        } catch (error) {
            console.error(error);
            setError("Unable to report blocker.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> SOS
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" /> Report Friction
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500 italic">
                        "What's blocking your flow? Be specific—Opti will use this to find a better person for the job or pivot the strategy."
                    </p>
                    <Textarea 
                        placeholder="I'm stuck because... (e.g. lack of API documentation, skill gap in Redis, etc.)"
                        value={complaint}
                        onChange={(e) => setComplaint(e.target.value)}
                        className="min-h-[120px] focus-visible:ring-red-500"
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button 
                        variant="destructive" 
                        onClick={handleSubmit} 
                        disabled={loading || !complaint.trim()}
                        className="w-full font-bold shadow-lg shadow-red-100"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Broadcast SOS"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
