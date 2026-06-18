"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

/** Thin status strip shown at the top of the app, with a profile avatar. */
export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { demoMode, profile } = useStore();
  const initials = (profile?.full_name || "You")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="speed-tab flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <span className="mono text-sm font-black text-white">MH</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold uppercase tracking-wider">{title}</h1>
            {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {demoMode && (
            <span className="rounded-full border border-accent-3/40 bg-accent-3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-3">
              Demo
            </span>
          )}
          <Link
            href="/profile"
            aria-label="Profile"
            className="block h-9 w-9 overflow-hidden rounded-full border border-border bg-surface-2"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                {initials}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
