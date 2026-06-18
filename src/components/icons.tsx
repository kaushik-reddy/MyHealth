"use client";

type P = React.SVGProps<SVGSVGElement> & { size?: number };

function svg(path: React.ReactNode, { size = 24, ...rest }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {path}
    </svg>
  );
}

/* ---------- metric icons ---------- */
export const StepsIcon = (p: P) =>
  svg(
    <>
      <path d="M7 13c0-3 .5-6 2.5-6S12 9 12 12c0 2-1 4-3 4s-2-1-2-3z" />
      <path d="M9 17c0 1.5-.5 3-2 3s-2-1.5-2-3" />
      <path d="M17 9c0-3-.5-6-2.5-6S12 5 12 8" />
      <path d="M15 13c0 1.5.5 3 2 3s2-1.5 2-3" />
    </>,
    p
  );

export const ProteinIcon = (p: P) =>
  svg(
    <>
      <path d="M6 18l-1.5 1.5a2 2 0 01-3-3L3 15" />
      <path d="M7 17l9-9a4 4 0 00-1-6 4 4 0 00-6-1L8 2" />
      <path d="M14 4l6 6" />
      <circle cx="15.5" cy="8.5" r="3.5" />
    </>,
    p
  );

export const WaterIcon = (p: P) =>
  svg(<path d="M12 3s6 6 6 10a6 6 0 11-12 0c0-4 6-10 6-10z" />, p);

export const SugarIcon = (p: P) =>
  svg(
    <>
      <path d="M3 9l9-5 9 5-9 5-9-5z" />
      <path d="M3 9v6l9 5 9-5V9" />
      <path d="M12 14v6" />
    </>,
    p
  );

export const FlameIcon = (p: P) =>
  svg(
    <path d="M12 3c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 1-5 1 1 2 1 3-4z" />,
    p
  );

export const RouteIcon = (p: P) =>
  svg(
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 000-8H10a4 4 0 010-8h6" />
    </>,
    p
  );

export const PathIcon = (p: P) =>
  svg(
    <path d="M5 3c3 0 3 4 6 4s3-4 6-4M5 10c3 0 3 4 6 4s3-4 6-4M5 17c3 0 3 4 6 4s3-4 6-4" />,
    p
  );

export const ScaleIcon = (p: P) =>
  svg(
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9a4 4 0 018 0" />
      <path d="M12 9v3" />
    </>,
    p
  );

export const MealIcon = (p: P) =>
  svg(
    <>
      <path d="M4 3v7a2 2 0 002 2 2 2 0 002-2V3M6 3v18" />
      <path d="M16 3c-1.5 0-3 2-3 5s1.5 4 3 4v9" />
    </>,
    p
  );

/* ---------- mood faces ---------- */
export const MoodGreat = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14a4 4 0 008 0" />
      <path d="M8.5 9h.01M15.5 9h.01" />
    </>,
    p
  );
export const MoodOk = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15a3 3 0 016 0" />
      <path d="M8.5 9h.01M15.5 9h.01" />
    </>,
    p
  );
export const MoodTired = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15h6" />
      <path d="M7.5 9.5l2-1M16.5 9.5l-2-1" />
    </>,
    p
  );
export const MoodBad = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 16a4 4 0 018 0" />
      <path d="M8.5 9h.01M15.5 9h.01" />
    </>,
    p
  );

/* ---------- ui icons ---------- */
export const CheckIcon = (p: P) => svg(<path d="M5 12l5 5L20 7" />, p);
export const CloseIcon = (p: P) => svg(<path d="M6 6l12 12M18 6L6 18" />, p);
export const PlusIcon = (p: P) => svg(<path d="M12 5v14M5 12h14" />, p);
export const EditIcon = (p: P) =>
  svg(
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </>,
    p
  );
export const ChevronLeft = (p: P) => svg(<path d="M15 18l-6-6 6-6" />, p);
export const ChevronRight = (p: P) => svg(<path d="M9 18l6-6-6-6" />, p);
export const ChevronDown = (p: P) => svg(<path d="M6 9l6 6 6-6" />, p);
export const ArrowRight = (p: P) => svg(<path d="M5 12h14M13 6l6 6-6 6" />, p);

export const HomeIcon = (p: P) =>
  svg(
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>,
    p
  );
export const CalendarIcon = (p: P) =>
  svg(
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>,
    p
  );
export const ChartIcon = (p: P) =>
  svg(
    <>
      <path d="M4 19h16" />
      <path d="M7 16V9M12 16V5M17 16v-4" />
    </>,
    p
  );
export const GearIcon = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1L14.5 2h-5l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L3 11a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.6h5l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5a7 7 0 00.1-1z" />
    </>,
    p
  );

/* mood metadata helper */
export const MOODS = [
  { value: "great", label: "Great", Icon: MoodGreat, color: "#34d399" },
  { value: "ok", label: "Okay", Icon: MoodOk, color: "#60a5fa" },
  { value: "tired", label: "Tired", Icon: MoodTired, color: "#facc15" },
  { value: "bad", label: "Low", Icon: MoodBad, color: "#f87171" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];
