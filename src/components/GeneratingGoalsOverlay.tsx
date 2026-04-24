"use client";

import { Target } from "lucide-react";
import { useOptiChrome } from "@/components/OptiChromeContext";
import { cn } from "@/lib/utils";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-slate-200 via-slate-50 to-slate-200 bg-[length:200%_100%] animate-goal-shimmer",
        className,
      )}
    />
  );
}

function SkeletonGoalCard({ muted }: { muted?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-100 bg-white/95 p-8 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.06)]",
        muted && "opacity-85",
      )}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          <ShimmerBar className="h-5 w-[70%] max-w-md" />
          <div className="h-4 w-24 rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div className="h-8 w-14 shrink-0 rounded-lg bg-slate-100 animate-pulse" />
      </div>
      <div className="mb-6 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <ShimmerBar className="h-full w-2/5 rounded-full opacity-90" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-2.5 w-12 rounded bg-slate-100 animate-pulse" />
              <ShimmerBar className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Target className="h-3.5 w-3.5 text-emerald-400/80" />
        <span>Shaping your goal…</span>
      </div>
    </div>
  );
}

/** Shown over the goals list while AI orchestration is in flight (admins on Goals page). */
export function GeneratingGoalsOverlay({ enabled }: { enabled: boolean }) {
  const { aiGenerating } = useOptiChrome();
  if (!enabled || !aiGenerating) return null;

  return (
    <div
      className="absolute inset-0 z-[2] flex flex-col gap-4 rounded-3xl border border-slate-100/80 bg-white/88 p-4 pt-6 backdrop-blur-[3px] md:p-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Generating goals"
    >
      <SkeletonGoalCard />
      <SkeletonGoalCard muted />
    </div>
  );
}
