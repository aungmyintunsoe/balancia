"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CopyErrorButton({ error, stack }: { error: string, stack: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullError = `Error: ${error}\n\nStack Trace:\n${stack}`;
        navigator.clipboard.writeText(fullError);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="mt-3 text-xs flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors"
        >
            {copied ? (
                <>
                    <Check className="h-3 w-3" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="h-3 w-3" />
                    Copy Error Detail
                </>
            )}
        </Button>
    );
}
