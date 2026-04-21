'use server'
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"


export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    if (error) {
        redirect(`/auth?error=${encodeURIComponent(error.message)}`)
    }
    revalidatePath('/', 'layout')
    redirect('/workspaces')
}

export async function signUp(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })
    if (error) {
        redirect(`/auth?error=${encodeURIComponent(error.message)}`)
    }
    revalidatePath('/', 'layout')
    redirect('/workspaces')
}