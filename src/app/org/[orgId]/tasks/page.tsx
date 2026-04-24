import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Filter, ListFilter } from "lucide-react";
import { TaskListClient } from "@/components/ui/dashboard/TaskListClient";

export default async function TasksPage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) redirect("/auth");

    const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    const isAdmin = membership?.role === 'admin';

    // Updated query to ensure we get due_date, time_spent, and avatar_url
    let query = supabase
        .from("tasks")
        .select(`
            *,
            structured_goals (
                description,
                projects ( vague_goal_text )
            ),
            assigned_to_profile:profiles!tasks_assigned_to_fkey ( full_name, avatar_url )
        `)
        .eq("org_id", orgId);

    if (!isAdmin) {
        query = query.eq("assigned_to", user.id);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
        console.error("Tasks Query Error:", tasksError);
    }

    return (
        <div className="p-6 md:p-8 max-w-screen-xl mx-auto animate-in fade-in duration-500 bg-[#fafbfc] min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tasks</h1>
                <p className="text-slate-500 text-sm mt-1">Track and manage all team tasks</p>
            </header>
            
            {/* Filter Bar styled like Pic 1 */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-6 mb-6 max-w-2xl">
                <div className="flex items-center gap-2 pl-2 border-r border-slate-100 pr-4">
                    <Filter className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">Status:</span>
                    <div className="border border-slate-200 rounded-full px-4 py-1 text-xs text-slate-400 bg-slate-50 min-w-[100px]">All</div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">Priority:</span>
                    <div className="border border-slate-200 rounded-full px-4 py-1 text-xs text-slate-400 bg-slate-50 min-w-[100px]">All</div>
                </div>
            </div>

            <div className="space-y-5">
                <TaskListClient initialTasks={tasks || []} />
            </div>
        </div>
    );
}