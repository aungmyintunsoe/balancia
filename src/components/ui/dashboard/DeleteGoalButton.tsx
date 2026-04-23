"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProject } from "@/app/actions";
import { useState } from "react";

export default function DeleteGoalButton({ projectId, orgId }: { projectId: string, orgId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Stop Link from navigating
        e.stopPropagation(); // Stop Link from navigating
        
        if (!confirm("Are you sure you want to delete this goal and all its tasks?")) return;
        
        setIsDeleting(true);
        try {
            await deleteProject(projectId, orgId);
        } catch (error) {
            alert("Failed to delete goal");
            setIsDeleting(false);
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    );
}
