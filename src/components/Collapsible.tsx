"use client";

import { useState } from "react";

/**
 * A minimized-by-default card section. Shows a compact summary of the day's
 * data when collapsed; expands to reveal the inputs/children when tapped.
 */
export default function Collapsible({
  title,
  tint = "var(--accent)",
  summary,
  defaultOpen = false,
  delay = 0,
  children,
}: {
  title: string;
  tint?: string;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card rise-in overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: tint }} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          {!open && summary != null && (
            <div className="mt-1 truncate text-xs text-muted">{summary}</div>
          )}
        </div>
        <span
          className="shrink-0 text-muted transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="space-y-4 px-5 pb-5 pt-1">{children}</div>
      )}
    </div>
  );
}
