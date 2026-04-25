"use client";

import { useState } from "react";
import { signOut } from "@/app/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, X } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import { OrgSidebarBrand } from "@/components/OrgSidebarBrand";
import { OptiChromeProvider } from "@/components/OptiChromeContext";

type OrgShellProps = {
  orgId: string;
  orgName: string;
  joinCode: string;
  children: React.ReactNode;
};

export function OrgShell({ orgId, orgName, joinCode, children }: OrgShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <OptiChromeProvider>
      <div className="min-h-screen flex bg-[#f8f8f8] font-sans">
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-4 h-14 md:hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Balancia" className="h-7 w-auto object-contain" />
            <span className="text-sm font-black tracking-tight text-slate-800">Balancia</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
          </button>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — desktop: always visible, mobile: slide-in drawer */}
        <aside
          className={`
            fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:static md:shrink-0
          `}
        >
          <OrgSidebarBrand orgId={orgId} />

          <div className="p-4 flex-1" onClick={() => setMobileOpen(false)}>
            <NavLinks orgId={orgId} />
          </div>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {orgName}
            </div>
            <Badge
              variant="outline"
              className="font-mono tracking-widest text-xs border-[#8ef04d] text-[#6bc135]"
            >
              {joinCode}
            </Badge>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-500 hover:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </form>
          </div>
        </aside>

        {/* Main content — add top padding on mobile for the fixed top bar */}
        <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
      </div>
    </OptiChromeProvider>
  );
}
