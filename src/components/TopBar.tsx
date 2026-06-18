"use client";

import { useStore } from "@/lib/store";

/** Thin "telemetry" strip shown at the top of the app, F1-style. */
export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { demoMode } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="speed-tab flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <span className="mono text-sm font-black text-[#0e1512]">MH</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold uppercase tracking-wider">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {demoMode && (
          <span className="rounded-full border border-accent-3/40 bg-accent-3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-3">
            Demo
          </span>
        )}
      </div>
    </header>
  );
}
