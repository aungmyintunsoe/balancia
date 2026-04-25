"use client";

import Image from "next/image";
import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";
import { useOptiChrome } from "@/components/OptiChromeContext";
export function OrgSidebarBrand({ orgId }: { orgId: string }) {
  const { aiGenerating, goalNodKey, taskCompleteSpinKey } = useOptiChrome();

  return (
    <Link
      href={`/org/${orgId}/dashboard`}
      className="h-20 px-5 border-b border-slate-200 flex items-center gap-3"
    >
      <div
        className={cn(
          "w-12 h-8 shrink-0 flex items-center justify-center",
          aiGenerating && "animate-opti-float",
        )}
      >
        <div
          key={`nod-${goalNodKey}`}
          className={cn(
            "inline-flex origin-center",
            goalNodKey > 0 && "animate-opti-nod",
          )}
        >
          <div
            key={`spin-${taskCompleteSpinKey}`}
            className={cn(
              "inline-flex origin-center",
              taskCompleteSpinKey > 0 && "animate-opti-spin-snap",
            )}
          >
            <Tilt
              tiltMaxAngleX={15}
              tiltMaxAngleY={15}
              scale={1.05}
              tiltEnable={!aiGenerating}
              className="inline-block"
            >
              <Image
                src="/logo.png"
                alt="Opti"
                width={120}
                height={80}
                className="h-8 max-h-8 w-auto object-contain mix-blend-multiply active:scale-90 active:rotate-12 transition-[transform,filter] duration-150 cursor-pointer select-none"
                draggable={false}
              />
            </Tilt>
          </div>
        </div>
      </div>
      <span className="text-2xl font-bold font-sans text-slate-900 tracking-tight leading-none">
        Balancia
      </span>
    </Link>
  );
}
