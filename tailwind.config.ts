import type { Config } from "tailwindcss";

/** Tailwind v4: loaded via `@config` in `src/app/globals.css` — extends theme without replacing defaults. */
const config = {
  theme: {
    extend: {
      keyframes: {
        "opti-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "opti-nod": {
          "0%": { transform: "scale(1, 1)" },
          "28%": { transform: "scale(1.14, 0.78)" },
          "48%": { transform: "scale(0.94, 1.1)" },
          "68%": { transform: "scale(1.06, 0.94)" },
          "100%": { transform: "scale(1, 1)" },
        },
        "opti-spin-snap": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "goal-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "opti-float": "opti-float 2.1s ease-in-out infinite",
        "opti-nod": "opti-nod 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "opti-spin-snap": "opti-spin-snap 0.34s cubic-bezier(0.2, 0.9, 0.15, 1) both",
        "goal-shimmer": "goal-shimmer 1.8s ease-in-out infinite",
      },
    },
  },
} satisfies Config;

export default config;
