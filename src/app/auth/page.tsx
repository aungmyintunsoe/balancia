'use client'

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { login, signUp } from "./action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, AlertCircle, Loader2 } from "lucide-react"


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
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <Code2 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight italic">
                        {mode === 'login' ? 'Welcome Back' : 'Join HackFlow'}
                    </CardTitle>
                    <CardDescription>
                        {mode === 'login'
                            ? 'Enter your credentials to access your workspaces'
                            : 'Start building and managing your dream team'}
                    </CardDescription>
                </CardHeader>

                <form
                    action={async (formData) => {
                        setLoading(true)
                        if (mode === 'login') await login(formData)
                        else await signUp(formData)
                        setLoading(false)
                    }}
                >
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 animate-in fade-in zoom-in duration-200">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}

                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="name@company.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full h-11 font-bold text-base" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'login' ? 'Sign In' : 'Register Now'}
                        </Button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary"
                        >
                            {mode === 'login'
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Log in"}
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
