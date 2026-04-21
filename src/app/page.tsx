import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-12">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Code2 className="h-6 w-6" />
          <span>HACKFLOW</span>
        </div>
        <nav>
          <Button variant="ghost" asChild>
            <Link href="/auth">Login</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center space-y-10 px-6 py-24 text-center md:py-32 lg:py-40">
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
              Stop Guessing. Let AI Build and Manage Your{" "}
              <span className="text-primary">Tech Team.</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl font-medium">
              The intelligent workspace for hackathons and fast-moving teams.
              Deploy resources, manage milestones, and scale with AI-driven insights.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
              <Link href="/auth">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
              Live Demo
            </Button>
          </div>

          {/* Optional: Simple feature highlight */}
          <div className="grid grid-cols-1 gap-8 pt-12 md:grid-cols-3 md:gap-12">
            {[
              { title: "AI-Led", desc: "Automated task distribution" },
              { title: "Rapid Org", desc: "6-digit join codes for instant setup" },
              { title: "Real-time", desc: "Live collaboration dashboard" },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <span className="font-bold text-lg">{f.title}</span>
                <span className="text-sm text-muted-foreground">{f.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
