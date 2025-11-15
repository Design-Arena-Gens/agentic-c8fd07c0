import "./globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Veo 3.1 Structured Prompt Builder",
  description: "Transform messy ideas into a perfect structured JSON prompt for Veo 3.1 high-budget cinematic video generation.",
  metadataBase: new URL("https://agentic-c8fd07c0.vercel.app"),
  openGraph: {
    title: "Veo 3.1 Structured Prompt Builder",
    description: "Transform messy ideas into structured JSON prompts.",
    url: "https://agentic-c8fd07c0.vercel.app",
    siteName: "Veo Prompt Builder",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={clsx("min-h-full bg-neutral-950 text-neutral-100 antialiased")}> 
        <div className="mx-auto max-w-7xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-500" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Veo 3.1 Structured Prompt Builder</h1>
                <p className="text-xs text-neutral-400">Cinematic. Consistent characters. Production-grade control.</p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              <a className="hover:text-white transition" href="/">Builder</a>
              <a className="hover:text-white transition" href="/about">About</a>
            </nav>
          </header>
          {children}
          <footer className="mt-10 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
            Built for Veo 3.1 prompt design. Deployed on Vercel.
          </footer>
        </div>
      </body>
    </html>
  );
}
