'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Users, ClipboardList, BarChart2, LayoutGrid, UserCircle2 } from "lucide-react";

const navLinks = [
    { href: "goals", label: "Goals", icon: Target },
    { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "employees", label: "Employee", icon: Users },
    { href: "tasks", label: "Tasks", icon: ClipboardList },
    { href: "analytics", label: "Analytics", icon: BarChart2 },
    { href: "profile", label: "Profile", icon: UserCircle2 },
    { href: "/workspaces", label: "Switch Org", icon: LayoutGrid },
];

export function NavLinks({ orgId }: { orgId: string }) {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
                const fullHref = href.startsWith('/') ? href : `/org/${orgId}/${href}`;
                const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

                return (
                    <Link
                        key={href}
                        href={fullHref}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${isActive
                                ? 'bg-green-100 text-[#22c55e] shadow-sm'
                                : 'text-slate-600 hover:text-[#22c55e] hover:bg-green-50/80'
                            }`}
                    >
                        <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
