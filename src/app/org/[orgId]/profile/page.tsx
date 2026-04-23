import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfileBasics } from "@/app/actions/profileActions";
import { SkillManager } from "@/components/ui/dashboard/SkillManager";

export default async function ProfilePage(props: { params: Promise<{ orgId: string }> }) {
    await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

    const { data: mySkills } = await supabase
        .from("employee_skills")
        .select("skill_name, proficiency_level")
        .eq("user_id", user.id);

    return (
        <div className="p-6 md:p-8 max-w-screen-lg mx-auto animate-in fade-in duration-500 space-y-6">
            <header>
                <h1 className="text-3xl font-black text-slate-900">Your Profile</h1>
                <p className="text-sm text-slate-500">Keep your profile and skills current so AI can route tasks better.</p>
            </header>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold">Basics</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateProfileBasics} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Name</Label>
                            <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={profile?.email || ""} disabled />
                        </div>
                        <Button type="submit" className="bg-[#22c55e] hover:bg-[#16a34a]">Save</Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold">Tools & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                    <SkillManager initialSkills={mySkills || []} />
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-50">
                <CardContent className="p-4 text-xs text-slate-500">
                    MBTI, aspiration, bandwidth, and self-rated trait sliders from wireframes are not persisted yet because
                    those columns do not exist in the current schema.
                </CardContent>
            </Card>
        </div>
    );
}
