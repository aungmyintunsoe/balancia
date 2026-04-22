'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Users, ClipboardList, BarChart2, Cpu } from "lucide-react";

const navLinks = [
    { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "goals", label: "Goals", icon: Target },
    { href: "tasks", label: "Tasks", icon: ClipboardList },
    { href: "employees", label: "Employees", icon: Users },
    { href: "analytics", label: "Analytics", icon: BarChart2 },
];

export function NavLinks({ orgId }: { orgId: string }) {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
                const fullHref = `/org/${orgId}/${href}`;
                const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

                return (
                    <Link
                        key={href}
                        href={fullHref}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${isActive
                                ? 'bg-green-50 text-[#22c55e] font-bold'
                                : 'text-slate-500 hover:text-[#22c55e] hover:bg-green-50/60'
                            }`}
                    >
                        <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                        <span className="hidden md:inline">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
