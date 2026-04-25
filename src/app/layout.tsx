import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8CE065",
};

export const metadata: Metadata = {
  title: {
    default: "Balancia — AI Workforce Orchestration",
    template: "%s | Balancia",
  },
  description:
    "The intelligent workspace for high-output teams. Balancia uses AI to orchestrate goals, balance workloads, and resolve friction before it starts.",
  metadataBase: new URL("https://balancia.app"),
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Balancia",
    title: "Balancia — AI Workforce Orchestration",
    description:
      "Orchestrate goals, balance workloads, and resolve friction with AI-powered team harmony.",
    url: "https://balancia.app",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Balancia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Balancia — AI Workforce Orchestration",
    description:
      "Orchestrate goals, balance workloads, and resolve friction with AI-powered team harmony.",
    images: ["/logo.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col font-sans text-slate-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}