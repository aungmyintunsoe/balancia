import { createWorkspace, joinWorkspace, signOut, deleteWorkspace } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"
import { LogOut, CheckCircle2, Users, Trash2, PlusCircle, UserPlus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CopyButton } from "@/components/ui/dashboard/CopyButton"
import { unwrapRelation } from "@/lib/supabase/relations"

export default async function WorkspacesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/auth')

    const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
            role,
            user_id,
            organizations (
                id,
                name,
                join_code,
                organization_members(count)
            )
        `)
        .eq('user_id', user.id)

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950">
            <nav className="border-b bg-white px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Updated Logo */}
                    <img src="/logo.png" alt="Balancia Logo" className="h-8 w-auto object-contain" />
                    <span className="text-xl font-black tracking-tight text-slate-800">Balancia</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 hidden sm:inline uppercase tracking-widest">{user?.email}</span>
                    <form action={signOut}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </Button>
                    </form>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-12 px-6 space-y-12">
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">Your Workspaces</h2>
                    
                    {memberships && memberships.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {memberships.map((m: any) => {
                                const org = unwrapRelation(m.organizations);
                                if (!org) return null;
                                const isAdmin = m.role === 'admin';

                                return (
                                    <Card key={org.id} className="hover:border-slate-300 transition-all cursor-pointer group h-full flex flex-col">
                                        <CardHeader className="pb-3 flex-row justify-between items-start space-y-0">
                                            <Link href={`/org/${org.id}/dashboard`} className="flex-1">
                                                <CardTitle className="text-lg group-hover:text-[#8CE065] transition-colors truncate">
                                                    {org.name}
                                                </CardTitle>
                                                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-100 rounded text-slate-500 mt-2 inline-block">
                                                    {m.role}
                                                </span>
                                            </Link>
                                            
                                            {/* Delete Button - Only visible to Admins */}
                                            {isAdmin && (
                                                <form action={async () => {
                                                    'use server';
                                                    await deleteWorkspace(org.id);
                                                }}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </CardHeader>
                                        
                                        <Link href={`/org/${org.id}/dashboard`} className="flex-1">
                                            <CardContent>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <p className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3 w-3 text-[#8CE065]" /> Active
                                                    </p>
                                                    <p className="flex items-center gap-1.5">
                                                        <Users className="h-3 w-3" /> 
                                                        {org.organization_members?.[0]?.count || 1} Member{org.organization_members?.[0]?.count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Link>

                                        <CardFooter className="pt-0 flex items-center justify-between">
                                            <span className="text-xs font-mono text-slate-400">Code: {org.join_code}</span>
                                            <CopyButton value={org.join_code} />
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed flex flex-col items-center">
                            <p className="text-muted-foreground mb-4 font-medium">You aren't in any workspaces yet.</p>
                        </div>
                    )}
                </section>

                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-lg text-slate-800">
                            <PlusCircle className="h-5 w-5 text-[#8CE065]" /> Create New
                        </div>
                        <Card className="border-slate-200">
                            <form action={createWorkspace}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Workspace Name</Label>
                                        <Input id="name" name="name" placeholder="e.g. Innovation Lab" required className="rounded-xl border-slate-200" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-[#8CE065] hover:bg-[#7bc956] text-white font-bold rounded-xl" type="submit">Initialize Workspace</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-lg text-slate-800">
                            <UserPlus className="h-5 w-5 text-[#8CE065]" /> Join Existing
                        </div>
                        <Card className="border-slate-200">
                            <form action={joinWorkspace}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="joinCode">6-Digit Access Code</Label>
                                        <Input id="joinCode" name="joinCode" placeholder="ABCDEF" maxLength={6} required className="font-mono text-center text-lg uppercase tracking-widest rounded-xl border-slate-200" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full rounded-xl" variant="outline" type="submit">Verify & Join</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}