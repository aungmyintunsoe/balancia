"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { generateProject } from "@/app/actions";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI Analyzing Team & Generating...
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
                    className="min-h-[120px] text-lg resize-none"
                    required
                />
            </div>

            <SubmitButton />
        </form>
    );
}
