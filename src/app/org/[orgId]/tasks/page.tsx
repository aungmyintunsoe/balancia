import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/ui/TaskCard";
import { Filter, ArrowUpDown, CheckCircle2, Clock, User, Target, ListFilter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TaskListClient } from "@/components/ui/dashboard/TaskListClient";

export default async function TasksPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members").select("role").eq("org_id", orgId).eq("user_id", user.id).single();

    const isAdmin = membership?.role === 'admin';

    let query = supabase
        .from("tasks")
        .select(`
            *,
            structured_goals (
                description,
                projects ( vague_goal_text )
            ),
            assigned_to_profile:profiles!tasks_assigned_to_fkey ( full_name )
        `)
        .eq("org_id", orgId);

    if (!isAdmin) {
        query = query.eq("assigned_to", user.id);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
        console.error("Tasks Query Error:", tasksError);
    }

    const { data: members } = await supabase
        .from('organization_members')
        .select(`user_id, profiles(full_name, email)`)
        .eq('org_id', orgId);

    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'To Do', className: 'bg-slate-100 text-slate-600 border-slate-200' },
        in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-600 border-blue-200' },
        done: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-200' },
        blocked: { label: 'Blocked', className: 'bg-red-50 text-red-600 border-red-200' },
    };

    const priorityConfig: Record<string, { label: string; className: string }> = {
        high: { label: 'High Priority', className: 'bg-red-50 text-red-500 border-red-200' },
        medium: { label: 'Medium Priority', className: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        low: { label: 'Low Priority', className: 'bg-slate-50 text-slate-500 border-slate-200' },
    };

    return (
        <div className="p-6 md:p-8 max-w-screen-lg mx-auto animate-in fade-in duration-500">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h1>
                    <p className="text-slate-500 text-sm">Track and manage all team tasks</p>
                </div>

            </header>
            
            {/* Filter Bar and Task List */}
            <div className="space-y-3">
                <TaskListClient initialTasks={tasks || []} />
            </div>
        </div>
    );
}
