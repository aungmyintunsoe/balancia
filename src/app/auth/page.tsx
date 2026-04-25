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
        <div className="min-h-screen bg-[#f4f4f4] px-4 sm:px-6 py-6 sm:py-8 md:px-12" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="mx-auto w-full max-w-5xl">
                
                {/* --- LOGO SECTION UPDATED --- */}
                <div className="mb-10 sm:mb-16 flex items-center gap-3">
                    <img src="/logo.png" alt="Balancia Logo" className="w-16 h-10 object-contain mix-blend-multiply" />
                    <span className="text-4xl font-bold font-sans text-slate-900 tracking-tight">Balancia</span>
                </div>
                {/* ---------------------------- */}

                <div className="mb-10">
                    <p className="text-slate-400 uppercase font-sans tracking-widest text-sm mb-2">
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </p>
                    
                    {/* --- HEADER COLOR UPDATED --- */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-sans text-[#8ef04d] leading-none tracking-tight">
                        {mode === 'login' ? 'WELCOME BACK' : 'BUILD A BALANCED TEAM'}
                    </h1>
                    {/* ---------------------------- */}
                    
                    <p className="text-lg sm:text-2xl mt-4 text-slate-400 font-bold font-sans">
                        {mode === 'login'
                            ? 'Sign in as a manager or as an employee invited by your manager.'
                            : 'Manager accounts can invite teammates with one click.'}
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
                            className="h-14 bg-white border-none shadow-sm text-lg font-sans text-slate-700 placeholder:text-slate-300"
                        />
                    )}
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        required
                        className="h-14 bg-white border-none shadow-sm text-lg font-sans text-slate-700 placeholder:text-slate-300 focus-visible:ring-[#8ef04d]"
                    />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password (min 6)"
                        required
                        className="h-14 bg-white border-none shadow-sm text-lg font-sans text-slate-700 placeholder:text-slate-300 focus-visible:ring-[#8ef04d]"
                    />
                    
                    {/* --- BUTTON COLOR UPDATED --- */}
                    <Button className="w-full h-14 font-bold font-sans text-2xl bg-[#8ef04d] hover:bg-[#7ce03c] text-white transition-colors rounded-xl shadow-sm" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                    </Button>
                    {/* ---------------------------- */}
                    
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-sm text-slate-400 hover:text-[#8ef04d] transition-colors font-sans"
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