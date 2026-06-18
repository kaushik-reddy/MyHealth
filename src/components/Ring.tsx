"use client";

interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  unit?: string;
  children?: React.ReactNode;
}

export default function Ring({
  value,
  max,
  size = 120,
  stroke = 10,
  color = "var(--accent)",
  track = "var(--surface-3)",
  label,
  unit,
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = c * (1 - pct);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span className="mono text-xl font-bold leading-none">
              {Math.round(value)}
            </span>
            {unit && (
              <span className="text-[10px] uppercase tracking-wide text-muted">
                {unit}
              </span>
            )}
            {label && (
              <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
