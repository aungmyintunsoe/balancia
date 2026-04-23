import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfileBasics } from "@/app/actions/profileActions";
import { SkillManager } from "@/components/ui/dashboard/SkillManager";

export default async function ProfilePage(props: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, bio, mbti, bandwidth_hours, career_aspiration")
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
                    <CardTitle className="text-base font-bold">Profile & Work Identity</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateProfileBasics} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Name</Label>
                                <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={profile?.email || ""} disabled className="bg-slate-50 text-slate-500" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio">Biography / Role Context</Label>
                                <Input id="bio" name="bio" defaultValue={profile?.bio || ""} placeholder="What do you do here?" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mbti">MBTI / Work Style</Label>
                                <Input id="mbti" name="mbti" defaultValue={profile?.mbti || ""} placeholder="e.g. INTJ" maxLength={4} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bandwidthHours">Weekly Bandwidth (Hours)</Label>
                                <Input id="bandwidthHours" name="bandwidthHours" type="number" step="0.5" defaultValue={profile?.bandwidth_hours || 40} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="careerAspiration">Career Aspiration</Label>
                                <Input id="careerAspiration" name="careerAspiration" defaultValue={profile?.career_aspiration || ""} placeholder="e.g. Lead Developer, Director" />
                            </div>
                        </div>
                        <Button type="submit" className="bg-[#22c55e] hover:bg-[#16a34a] mt-2 shadow-lg shadow-emerald-100">Save Identity</Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold">Tools & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                    <SkillManager initialSkills={mySkills || []} orgId={orgId} />
                </CardContent>
            </Card>
        </div>
    );
}
