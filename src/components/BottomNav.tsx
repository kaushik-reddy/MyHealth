"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today", icon: HomeIcon },
  { href: "/checkin", label: "Check-in", icon: PlusIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/sugar", label: "Sugar", icon: DropIcon },
  { href: "/progress", label: "Progress", icon: ChartIcon },
  { href: "/profile", label: "Profile", icon: GearIcon },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="pointer-events-none sticky bottom-0 z-30 px-4 pb-5 pt-2">
      <div className="nav-pill pointer-events-auto mx-auto flex max-w-xs items-center justify-between px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
              style={{ background: active ? "var(--accent)" : "transparent" }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: active ? "#fff" : "var(--muted)" }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IP = React.SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function HomeIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function PlusIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function DropIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 3s6 6 6 10a6 6 0 11-12 0c0-4 6-10 6-10z" />
    </svg>
  );
}
function ChartIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 19h16" />
      <path d="M7 16V9M12 16V5M17 16v-4" />
    </svg>
  );
}
function CalendarIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}
function GearIcon(p: IP) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1L14.5 2h-5l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L3 11a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.6h5l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5a7 7 0 00.1-1z" />
    </svg>
  );
}
