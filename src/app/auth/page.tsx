'use client'

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { login, signUp } from "./action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2 } from "lucide-react"


export default function AuthPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fafafa]">Loading Auth...</div>}>
            <AuthContent />
        </Suspense>
    )
}


function AuthContent() {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen bg-[#f4f4f4] px-6 py-8 md:px-12">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-16 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-[#43e400] text-black font-black flex items-center justify-center">B</div>
                    <span className="text-4xl font-black text-slate-900">Balancia</span>
                </div>
                <div className="mb-10">
                    <p className="text-slate-400 uppercase font-semibold tracking-wide text-sm">
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </p>
                    <h1 className="text-6xl font-black text-[#43e400] mt-2 leading-none">
                        {mode === 'login' ? 'WELCOME BACK' : 'BUILD A BALANCED TEAM'}
                    </h1>
                    <p className="text-3xl mt-4 text-slate-400 font-bold">
                        {mode === 'login'
                            ? 'Sign In as a manager or as an employee invited by your manager.'
                            : 'Manager account can invite teammates with one click'}
                    </p>
                </div>
                <form
                    className="space-y-6"
                    action={async (formData) => {
                        setLoading(true)
                        if (mode === 'login') await login(formData)
                        else await signUp(formData)
                        setLoading(false)
                    }}
                >
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-200">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}
                    {mode === 'signup' && (
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Your full name"
                            required
                            className="h-14 bg-white border-none shadow-sm text-lg"
                        />
                    )}
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        required
                        className="h-14 bg-white border-none shadow-sm text-lg"
                    />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password (min 6)"
                        required
                        className="h-14 bg-white border-none shadow-sm text-lg"
                    />
                    <Button className="w-full h-14 font-black text-2xl bg-[#43e400] hover:bg-[#33c700] text-white" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                        </Button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-sm text-slate-500 hover:text-[#43e400] transition-colors font-semibold"
                    >
                        {mode === 'login'
                            ? "New manager? Create an account"
                            : "Already have an account? Sign in"}
                    </button>
                </form>
            </div>
        </div>
    )
}
