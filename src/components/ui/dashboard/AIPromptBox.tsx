"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { generateProject } from "../../../app/actions";

import { useState, useEffect } from "react";

function SubmitButton() {
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
            disabled={pending} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
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
    // We use a hidden input to pass the orgId to the server action
    return (
        <form action={generateProject} className="space-y-4">
            <input type="hidden" name="orgId" value={orgId} />

            <div className="space-y-2">
                <Textarea
                    name="vagueGoalText"
                    placeholder="e.g. Build a landing page for our new soda brand 'Fizzo' with a signup form."
                    className="min-h-[120px] text-lg resize-none border-emerald-100 focus-visible:ring-emerald-500 rounded-2xl"
                    required
                />
            </div>

            <SubmitButton />
            <p className="text-[10px] text-center text-slate-400 font-medium">AI will distribute tasks based on member skills and availability.</p>
        </form>
    );
}
