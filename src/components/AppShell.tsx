"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Background from "./Background";

export default function AppShell({
  title,
  subtitle,
  children,
  requireProfile = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  requireProfile?: boolean;
}) {
  const { ready, profile } = useStore();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && requireProfile && !profile && path !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [ready, profile, requireProfile, router, path]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Background />
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <span className="text-xs uppercase tracking-widest text-muted">
            Warming up tyres…
          </span>
        </div>
      </div>
    );
  }

  if (requireProfile && !profile) return null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <Background />
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 px-4 pb-6 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
