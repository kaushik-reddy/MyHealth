"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusIcon,
  CalendarIcon,
  ChartIcon,
  GearIcon,
} from "@/components/icons";

const items = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/checkin", label: "Check-in", Icon: PlusIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/progress", label: "Progress", Icon: ChartIcon },
  { href: "/profile", label: "Profile", Icon: GearIcon },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="pointer-events-none sticky bottom-0 z-30 mt-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="nav-pill pointer-events-auto mx-auto flex max-w-xs items-center justify-around gap-1 px-2.5 py-2.5">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl transition active:scale-90"
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 75%, black))",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)",
                  }}
                />
              )}
              <Icon
                size={21}
                className="relative"
                style={{ color: active ? "#fff" : "var(--muted)" }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
