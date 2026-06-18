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
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="h-4 w-1 shrink-0 rounded-full" style={{ background: tint }} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
          {!open && summary != null && (
            <div className="mt-0.5 truncate text-[11px] text-muted">{summary}</div>
          )}
        </div>
        <span
          className="shrink-0 text-base text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
