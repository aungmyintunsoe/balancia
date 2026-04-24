import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Leaf, Sparkles, Target, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f8faf9] selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            {/* Header / Nav */}
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <Leaf className="text-white w-6 h-6 fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-800">Balancia</span>
                    </div>
                    
                    {/* The menu links were deleted from here! */}
                    
                    <div className="flex items-center gap-8">
                        <Link href="/auth">
                            <Button className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
                                Launch Platform
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-40 pb-20">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-100/40 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered Team Harmony
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Work in <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">Perfect Balance.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        The intelligent workspace for high-output teams. Balancia uses AI to orchestrate goals, balance workloads, and resolve friction before it starts.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <Link href="/auth">
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-200 group">
                                Start Building <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24 text-left animate-in fade-in duration-1000 delay-500">
                        {[
                            { icon: Target, title: "Precision Goals", desc: "Managers input vague goals; AI creates the structured roadmap with tactical precision." },
                            { icon: Users, title: "Skill-Matched Roles", desc: "Tasks are automatically assigned based on employee proficiency and real-time load." },
                            { icon: TrendingUp, title: "Intelligent Pivots", desc: "When blockers arise, Balancia recommends the perfect reassignment to maintain flow." }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 py-12 bg-white">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5 opacity-50">
                        <Leaf className="text-slate-900 w-5 h-5 fill-current" />
                        <span className="text-sm font-bold tracking-tight text-slate-900 uppercase tracking-widest">Balancia</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">© 2026 Balancia Orchestrator · Empowered by Ilmu.ai</p>
                </div>
            </footer>
        </div>
    )
}
