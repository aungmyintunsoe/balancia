'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export async function createWorkspace(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = formData.get('name') as string
    const joinCode = generateJoinCode()
    const orgId = crypto.randomUUID()

    const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: orgId, name, join_code: joinCode })

    if (orgError) throw orgError

    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            user_id: user.id,
            org_id: orgId,
            role: 'admin'
        })

    if (memberError) throw memberError

    revalidatePath('/workspaces')
    redirect(`/org/${orgId}`)
}

export async function joinWorkspace(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const joinCode = formData.get('joinCode') as string

    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('join_code', joinCode.toUpperCase())
        .single()

    if (orgError || !org) {
        return redirect('/workspaces?error=Invalid Join Code')
    }

    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            user_id: user.id,
            org_id: org.id,
            role: 'employee'
        })

    if (memberError) {
        return redirect(`/org/${org.id}`)
    }

    revalidatePath('/workspaces')
    redirect(`/org/${org.id}`)
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth")
}

export async function deleteWorkspace(orgId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('projects').delete().eq('org_id', orgId); // Example cascade
    const { error: orgError } = await supabase.from('organizations').delete().eq('id', orgId);
    
    if (orgError) throw new Error(orgError.message);
    revalidatePath('/workspaces');
}