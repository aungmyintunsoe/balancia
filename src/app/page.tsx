import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Target, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f8faf9] selection:bg-[#8CE065]/20 selection:text-[#5cb83a] overflow-x-hidden">
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#8CE065]/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Balancia Logo" className="h-10 w-auto object-contain" />
                        <span className="text-xl font-black tracking-tight text-slate-800">Balancia</span>
                    </div>
                    
                    {/* Launch Platform Button removed as requested */}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-40 pb-20">
                {/* Decorative Background Elements updated to Lime Green */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#8CE065]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8CE065]/5 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8CE065]/10 border border-[#8CE065]/20 text-[#5cb83a] text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered Team Harmony
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Work in <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8CE065] via-[#7bc956] to-[#5cb83a]">Perfect Balance.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        The intelligent workspace for high-output teams. Balancia uses AI to orchestrate goals, balance workloads, and resolve friction before it starts.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <Link href="/auth">
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-[#8CE065] hover:bg-[#7bc956] text-white text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[#8CE065]/20 group">
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
                                <div className="w-12 h-12 bg-[#8CE065]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-[#8CE065]" />
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
                    <div className="flex items-center gap-3 opacity-50">
                        <img src="/logo.png" alt="Balancia Logo" className="h-6 w-auto object-contain grayscale brightness-0" />
                        <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">Balancia</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">© 2026 Balancia Orchestrator · Empowered by Ilmu.ai</p>
                </div>
            </footer>
        </div>
    )
}