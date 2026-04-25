"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { generateProject } from "../../../app/actions";
import { ORCHESTRATION_GOAL_MAX_CHARS } from "@/lib/orchestration-limits";

import { useState, useEffect, useRef } from "react";
import { useOptiChrome } from "@/components/OptiChromeContext";

function AiGeneratingBridge() {
    const { pending } = useFormStatus();
    const { setGeneratingSlot, triggerGoalNod } = useOptiChrome();
    const wasPending = useRef(false);

    useEffect(() => {
        setGeneratingSlot("goals-form", pending);
        return () => setGeneratingSlot("goals-form", false);
    }, [pending, setGeneratingSlot]);

    useEffect(() => {
        if (wasPending.current && !pending) {
            triggerGoalNod();
        }
        wasPending.current = pending;
    }, [pending, triggerGoalNod]);

    return null;
}

function SubmitButton({ blocked }: { blocked: boolean }) {
    const { pending } = useFormStatus();
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
        "Opti is analyzing team skills...",
        "Decomposing project goals...",
        "Optimizing resource allocation...",
        "Structuring micro-tasks...",
        "Finalizing roadmap..."
    ];

    useEffect(() => {
        if (!pending) return;
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [pending]);

    return (
        <Button 
            type="submit" 
            disabled={pending || blocked} 
            className="w-full bg-[#8ef04d] hover:bg-[#7ce03c] text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98] border-none shadow-sm"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {messages[messageIndex]}
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Orchestrate Workflow
                </>
            )}
        </Button>
    );
}

export default function AIPromptBox({ orgId }: { orgId: string }) {
    const [goalText, setGoalText] = useState("");
    const max = ORCHESTRATION_GOAL_MAX_CHARS;
    const trimmedLen = goalText.trim().length;
    const submitBlocked = trimmedLen === 0;

    return (
        <form action={generateProject} className="space-y-4">
            <input type="hidden" name="orgId" value={orgId} />
            <AiGeneratingBridge />

            <div className="space-y-2">
                <Textarea
                    name="vagueGoalText"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value.slice(0, max))}
                    maxLength={max}
                    placeholder="e.g. Build a landing page for our new soda brand 'Fizzo' with a signup form."
                    className="min-h-[120px] text-lg resize-none bg-[#f8faf9] border-none focus-visible:ring-[#8ef04d] rounded-2xl p-5 shadow-inner"
                    required
                    aria-describedby="goal-char-count"
                />
                <p
                    id="goal-char-count"
                    className="text-xs text-right font-medium tabular-nums text-slate-500"
                >
                    {goalText.length}/{max}
                </p>
            </div>

            <SubmitButton blocked={submitBlocked} />
            <p className="text-[10px] text-center text-slate-400 font-medium tracking-wide">
                AI will distribute tasks based on member skills and availability. Orchestration can take up to a couple of minutes.
            </p>
        </form>
    );
}