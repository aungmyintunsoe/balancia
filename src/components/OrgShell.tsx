"use client";

import { signOut } from "@/app/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
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
  return (
    <OptiChromeProvider>
      <div className="min-h-screen flex bg-[#f8f8f8] font-sans">
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <OrgSidebarBrand orgId={orgId} />

          <div className="p-4 flex-1">
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

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </OptiChromeProvider>
  );
}
