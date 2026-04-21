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
                <Card key={project.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl mb-1">{project.vague_goal_text}</CardTitle>
                                <div className="flex gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                    <Badge variant="secondary" className="capitalize">{project.status}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {project.structured_goals?.map((goal: any) => (
                                <div key={goal.id} className="space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {goal.description}
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-2 pl-4">
                                        {goal.tasks?.map((task: any) => (
                                            <div key={task.id} className="text-xs p-2 bg-slate-50 rounded border flex justify-between items-center">
                                                <span className="text-slate-600">{task.description}</span>
                                                {task.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
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
