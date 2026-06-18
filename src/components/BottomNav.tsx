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
    <nav className="pointer-events-none sticky bottom-0 z-30 px-4 pb-5 pt-2">
      <div className="nav-pill pointer-events-auto mx-auto flex max-w-xs items-center justify-between px-2 py-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
              style={{ background: active ? "var(--accent)" : "transparent" }}
            >
              <Icon size={20} style={{ color: active ? "#fff" : "var(--muted)" }} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
