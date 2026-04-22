'use client';

import { useTransition } from "react";
import { assignTask } from "@/app/actions/taskActions";
import { Loader2, UserPlus } from "lucide-react";

interface Member {
    user_id: string;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

interface AssigneeSelectorProps {
    taskId: string;
    orgId: string;
    members: Member[];
    currentAssigneeId?: string | null;
}

export function AssigneeSelector({ taskId, orgId, members, currentAssigneeId }: AssigneeSelectorProps) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (userId: string) => {
        if (!userId) return;
        startTransition(async () => {
            await assignTask(taskId, userId, orgId);
        });
    };

    return (
        <div className="flex items-center gap-2 w-full mt-2 border-t pt-4">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <select
                disabled={isPending}
                defaultValue={currentAssigneeId || ""}
                onChange={(e) => handleChange(e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer flex-1 font-medium"
            >
                <option value="" disabled>Assign to...</option>
                {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                        {m.profiles?.full_name || m.profiles?.email || "Unknown User"}
                    </option>
                ))}
            </select>
            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
    );
}
