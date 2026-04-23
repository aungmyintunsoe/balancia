'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label, className }: { value: string; label?: string, className?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={copy} 
            className={className || "h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#22c55e] transition-colors gap-1.5"}
        >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : label || "Copy Code"}
        </Button>
    );
}
