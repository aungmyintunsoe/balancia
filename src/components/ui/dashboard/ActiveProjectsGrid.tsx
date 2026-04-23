import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";

export default async function ActiveProjectsGrid({ orgId }: { orgId: string }) {
    const supabase = await createClient();

    const { data: projects } = await supabase
        .from("projects")
        .select(`
        *,
        structured_goals (
            id,
            description,
            tasks (
                id,
                description,
                status
            )
        )
    `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <p className="text-slate-400">No active orchestrations yet. Use the prompt box above!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-emerald-50/20 border-b border-emerald-50">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black text-slate-800 leading-tight">
                                    {project.vague_goal_text}
                                </CardTitle>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0.5 text-[9px]">
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8">
                            {project.structured_goals?.map((goal: any) => (
                                <div key={goal.id} className="space-y-4">
                                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {goal.description}
                                    </h4>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {goal.tasks?.map((task: any) => (
                                            <div key={task.id} className="group relative p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-medium text-slate-600 leading-relaxed pr-6">
                                                            {task.description}
                                                        </span>
                                                        {task.status === 'done' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-100 group-hover:border-emerald-200 shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                                            task.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 
                                                            task.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
