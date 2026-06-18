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
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-2 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.35rem))]">
        <div className="leading-tight">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
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
            className="block h-10 w-10 overflow-hidden rounded-full border border-border bg-surface-2"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
                {initials}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
