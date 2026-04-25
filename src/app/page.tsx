import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Target, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f8faf9] selection:bg-[#8CE065]/20 selection:text-[#5cb83a] overflow-x-hidden">
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#8CE065]/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/logo.png" alt="Balancia Logo" className="h-8 sm:h-10 w-auto object-contain" />
                        <span className="text-lg sm:text-xl font-black tracking-tight text-slate-800">Balancia</span>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-28 sm:pt-40 pb-16 sm:pb-20">
                {/* === BACKGROUND LAYER: Dot Grid with Breathing Animation === */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 w-full h-full animate-breathe opacity-60">
                        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="hero-dots" width="80" height="80" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1.5" fill="#8CE065" />
                                    <circle cx="45" cy="12" r="1" fill="#8CE065" opacity="0.6" />
                                    <circle cx="15" cy="55" r="1.2" fill="#8CE065" opacity="0.8" />
                                    <circle cx="65" cy="65" r="0.8" fill="#8CE065" opacity="0.4" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#hero-dots)" />
                        </svg>
                    </div>
                    {/* Gradient overlay to fade the dots */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f8faf9]/50 to-[#f8faf9]" />
                </div>

                {/* Animated Glassmorphic Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8CE065]/20 rounded-full blur-[100px] animate-drift" style={{ animationDuration: '15s' }} />
                    <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-[#7bc956]/15 rounded-full blur-[120px] animate-drift" style={{ animationDuration: '25s', animationDelay: '2s' }} />
                    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#8CE065]/10 rounded-full blur-[80px] animate-drift" style={{ animationDuration: '20s', animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 sm:space-y-10">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#8CE065]/10 border border-[#8CE065]/20 text-[#5cb83a] text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> AI-Powered Team Harmony
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Work in <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8CE065] via-[#7bc956] to-[#5cb83a] bg-[length:200%_auto] animate-text-shift">Perfect Balance.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-500 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 px-2">
                        The intelligent workspace for high-output teams. Balancia uses AI to orchestrate goals, balance workloads, and resolve friction before it starts.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 sm:pt-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <Link href="/auth">
                            <Button size="lg" className="h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-[#8CE065] hover:bg-[#7bc956] text-white text-base sm:text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[#8CE065]/20 group w-full sm:w-auto min-w-[200px]">
                                Start Building <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {/* === DASHBOARD TEASER === */}
                    <div className="pt-12 sm:pt-20 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
                        <div className="relative mx-auto max-w-4xl">
                            {/* Glassmorphic container */}
                            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_80px_-12px_rgba(140,224,101,0.25)] border border-white/60 bg-white/40 backdrop-blur-sm p-1.5 sm:p-2">
                                <img 
                                    src="/dashboard.png" 
                                    alt="Balancia Dashboard Preview" 
                                    className="w-full rounded-xl sm:rounded-2xl"
                                />
                            </div>
                            {/* Bottom fade into background */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-40 bg-gradient-to-t from-[#f8faf9] via-[#f8faf9]/80 to-transparent pointer-events-none rounded-b-3xl" />
                        </div>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 pt-12 sm:pt-24 text-left animate-in fade-in duration-1000 delay-500">
                        {[
                            { icon: Target, title: "Precision Goals", desc: "Managers input vague goals; AI creates the structured roadmap with tactical precision." },
                            { icon: Users, title: "Skill-Matched Roles", desc: "Tasks are automatically assigned based on employee proficiency and real-time load." },
                            { icon: TrendingUp, title: "Intelligent Pivots", desc: "When blockers arise, Balancia recommends the perfect reassignment to maintain flow." }
                        ].map((feature, i) => (
                            <div key={i} className="group p-6 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#8CE065]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8CE065]" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 py-8 sm:py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-end items-center">
                    <p className="text-slate-400 text-xs font-medium text-right">@2026 Five gals</p>
                </div>
            </footer>
        </div>
    )
}