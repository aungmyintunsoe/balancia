"use client";

import type { ReactNode } from "react";
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

/** One goal-shaped skeleton row for the in-flight orchestration (newest goal). */
function GeneratingGoalSkeletonRow() {
  return (
    <div
      className="relative rounded-3xl border border-emerald-200/60 bg-white p-8 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.06)] ring-1 ring-emerald-400/15 animate-in fade-in slide-in-from-bottom-2 duration-300"
      aria-busy="true"
      aria-label="Generating new goal"
    >
      <div className="absolute top-3 right-4 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        Creating…
      </div>
      <div className="flex items-start gap-4 mb-6 pr-24">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          <ShimmerBar className="h-5 w-[70%] max-w-md" />
          <div className="h-4 w-28 rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div className="h-8 w-14 shrink-0 rounded-lg bg-slate-100 animate-pulse" />
      </div>
      <div className="mb-6 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <ShimmerBar className="h-full w-1/3 rounded-full opacity-90" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
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

/**
 * Prepends a single skeleton “new goal” row while AI orchestration runs.
 * Existing goal cards stay visible. If there are no goals yet, only the skeleton shows (no empty state).
 */
export function GoalsListWithGeneratingSlot({
  isAdmin,
  hasProjects,
  children,
}: {
  isAdmin: boolean;
  hasProjects: boolean;
  children: ReactNode;
}) {
  const { aiGenerating } = useOptiChrome();
  const showSkeleton = Boolean(isAdmin && aiGenerating);
  const hideEmptyWhileGenerating = showSkeleton && !hasProjects;

  return (
    <div className="space-y-6">
      {showSkeleton ? <GeneratingGoalSkeletonRow /> : null}
      {hideEmptyWhileGenerating ? null : children}
    </div>
  );
}
