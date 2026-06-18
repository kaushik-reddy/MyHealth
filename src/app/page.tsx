"use client";

import Link from "next/link";
import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import {
  bmi,
  bmiCategory,
  dateKey,
  formatReachDate,
  projectWeight,
  tdee,
} from "@/lib/health";
import {
  StepsIcon,
  ProteinIcon,
  WaterIcon,
  SugarIcon,
  FlameIcon,
} from "@/components/icons";

export default function DashboardPage() {
  return (
    <AppShell
      title="Today"
      subtitle={new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
    >
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { profile, todayLog, logs } = useStore();

  const maintenance = profile
    ? tdee(
        profile.sex,
        profile.current_weight_kg,
        profile.height_cm,
        profile.age,
        profile.activity_level
      )
    : 0;

  const recent = useMemo(
    () => logs.slice(-14).filter((l) => l.calories_intake > 0),
    [logs]
  );

  const streak = useMemo(() => {
    const set = new Set(
      logs
        .filter((l) => l.steps || l.calories_intake || l.water_ml)
        .map((l) => l.log_date)
    );
    let s = 0;
    const d = new Date();
    while (set.has(dateKey(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [logs]);

  if (!profile) return null;

  const burned = maintenance + todayLog.active_calories;
  const net = todayLog.calories_intake - burned;
  const bmiVal = bmi(profile.current_weight_kg, profile.height_cm);
  const bmiCat = bmiCategory(bmiVal);

  const avgIntake =
    recent.length > 0
      ? recent.reduce((s, l) => s + l.calories_intake, 0) / recent.length
      : profile.daily_calorie_target;
  const avgBurn =
    recent.length > 0
      ? recent.reduce((s, l) => s + l.active_calories, 0) / recent.length
      : 200;

  const { reachDays } = projectWeight(profile, avgIntake, avgBurn);
  const reachDate = formatReachDate(reachDays);

  const toGo = profile.current_weight_kg - profile.goal_weight_kg;
  const remaining = Math.max(
    0,
    profile.daily_calorie_target - todayLog.calories_intake
  );

  // ----- Journey progress (Box Box "% completed" style) -----
  const totalToChange = Math.abs(profile.start_weight_kg - profile.goal_weight_kg);
  const changedSoFar = Math.abs(profile.start_weight_kg - profile.current_weight_kg);
  const journeyPct =
    totalToChange > 0 ? Math.min(changedSoFar / totalToChange, 1) : 0;
  const daysTracked = useMemo(
    () =>
      new Set(
        logs
          .filter((l) => l.steps || l.calories_intake || l.water_ml)
          .map((l) => l.log_date)
      ).size,
    [logs]
  );
  const totalKm = useMemo(
    () => logs.reduce((s, l) => s + (l.distance_km || 0), 0),
    [logs]
  );

  // ----- 14-day activity bars (per-round chart style) -----
  const activity = useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.log_date, l]));
    const out: { date: string; value: number; isToday: boolean; has: boolean }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const log = byDate.get(key);
      out.push({
        date: key,
        value: log?.calories_intake ?? 0,
        isToday: i === 0,
        has: !!log && (log.calories_intake > 0 || log.steps > 0),
      });
    }
    return out;
  }, [logs]);

  const goals: GoalRow[] = [
    {
      key: "calories",
      label: "Calories",
      value: todayLog.calories_intake,
      max: profile.daily_calorie_target,
      unit: "kcal",
      color: "#3b82f6",
      Icon: FlameIcon,
    },
    {
      key: "steps",
      label: "Steps",
      value: todayLog.steps,
      max: profile.daily_step_goal,
      unit: "",
      color: "#38bdf8",
      Icon: StepsIcon,
    },
    {
      key: "protein",
      label: "Protein",
      value: todayLog.protein_g,
      max: profile.daily_protein_goal_g,
      unit: "g",
      color: "#34d399",
      Icon: ProteinIcon,
    },
    {
      key: "water",
      label: "Water",
      value: todayLog.water_ml,
      max: profile.daily_water_goal_ml,
      unit: "ml",
      color: "#60a5fa",
      Icon: WaterIcon,
    },
    {
      key: "sugar",
      label: "Sugar",
      value: todayLog.sugar_g,
      max: profile.daily_sugar_limit_g,
      unit: "g",
      color: "#a5b4fc",
      Icon: SugarIcon,
      invert: true,
    },
  ];

  // overall day completion across all goals (sugar = adherence to staying under)
  const dayProgress = useMemo(() => {
    const anyLogged =
      todayLog.calories_intake > 0 ||
      todayLog.steps > 0 ||
      todayLog.protein_g > 0 ||
      todayLog.water_ml > 0 ||
      todayLog.sugar_g > 0;
    if (!anyLogged) return 0;
    const parts = goals.map((g) => {
      if (g.max <= 0) return 0;
      if (g.invert) return g.value <= g.max ? 1 : Math.max(0, g.max / g.value);
      return Math.min(g.value / g.max, 1);
    });
    return parts.reduce((s, p) => s + p, 0) / parts.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    todayLog.calories_intake,
    todayLog.steps,
    todayLog.protein_g,
    todayLog.water_ml,
    todayLog.sugar_g,
    profile.daily_calorie_target,
    profile.daily_step_goal,
    profile.daily_protein_goal_g,
    profile.daily_water_goal_ml,
    profile.daily_sugar_limit_g,
  ]);

  return (
    <div className="space-y-6">
      {/* ===== Hero: overall day progress ring ===== */}
      <section className="rise-in flex flex-col items-center pt-2">
        <HeroRing
          pct={dayProgress}
          calories={todayLog.calories_intake}
          target={profile.daily_calorie_target}
        />
        <p className="mt-5 text-sm text-muted">
          {remaining > 0 ? (
            <>
              <span className="font-semibold text-foreground">
                {remaining.toLocaleString()} kcal
              </span>{" "}
              left · {Math.round(dayProgress * 100)}% of goals met
            </>
          ) : (
            <span className="font-semibold text-foreground">
              {Math.round(dayProgress * 100)}% of today&apos;s goals met
            </span>
          )}
        </p>
      </section>

      {/* ===== Eaten / Burned / Balance ===== */}
      <section className="rise-in grid grid-cols-3 gap-3">
        <Tally label="Eaten" value={Math.round(todayLog.calories_intake)} />
        <Tally label="Burned" value={Math.round(burned)} />
        <Tally
          label="Balance"
          value={Math.round(net)}
          signed
          color={net <= 0 ? "var(--green)" : "var(--danger)"}
        />
      </section>

      {/* ===== Live tracker widget (lock-screen style) ===== */}
      <section className="rise-in space-y-3">
        <LiveTracker goals={goals} />
        <Motivation message={motivationFor(goals, remaining)} />
      </section>

      {/* ===== Journey progress (Box Box style) ===== */}
      <Link href="/progress" className="block">
        <JourneyProgress
          pct={journeyPct}
          changed={changedSoFar}
          total={totalToChange}
          losing={toGo >= 0}
          kmTotal={totalKm}
          daysTracked={daysTracked}
          reachLabel={
            reachDate
              ? reachDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null
          }
        />
      </Link>

      {/* ===== 14-day activity (per-round bar chart style) ===== */}
      <ActivityBars
        bars={activity}
        target={profile.daily_calorie_target}
        streak={streak}
      />

      {/* ===== Mini stats ===== */}
      <section className="rise-in grid grid-cols-3 gap-3">
        <MiniCard
          label="BMI"
          value={bmiVal.toFixed(1)}
          sub={bmiCat.label}
          tint={bmiCat.color}
        />
        <MiniCard label="Streak" value={`${streak}`} sub="days" tint="#60a5fa" />
        <MiniCard
          label="Distance"
          value={todayLog.distance_km.toFixed(1)}
          sub="km today"
          tint="#38bdf8"
        />
      </section>

      <Link
        href="/checkin"
        className="block rounded-full bg-accent py-4 text-center text-sm font-bold uppercase tracking-wider text-white transition active:scale-[0.98]"
      >
        Daily check-in
      </Link>
    </div>
  );
}

/* ---------- Hero ring (overall day progress) ---------- */
function HeroRing({
  pct,
  calories,
  target,
}: {
  pct: number;
  calories: number;
  target: number;
}) {
  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(pct, 0), 1);
  const offset = c * (1 - clamped);
  const complete = clamped >= 1;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={complete ? "#34d399" : "#3b82f6"} />
            <stop offset="100%" stopColor={complete ? "#10b981" : "#38bdf8"} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#hero)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
            filter: complete ? "drop-shadow(0 0 4px rgba(52,211,153,0.4))" : "none",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <div className="success-pop flex flex-col items-center">
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "rgba(52,211,153,0.12)",
                boxShadow: "0 0 14px rgba(52,211,153,0.25)",
              }}
            >
              <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <path
                  className="tick-draw"
                  d="M5 13l4 4L19 7"
                  stroke="#34d399"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-green">
              All goals met
            </span>
          </div>
        ) : (
          <>
            <span className="display text-6xl font-light">
              {Math.round(clamped * 100)}
              <span className="text-2xl text-muted">%</span>
            </span>
            <span className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
              day complete
            </span>
            <span className="mt-2 text-xs text-muted">
              {Math.round(calories).toLocaleString()} / {target.toLocaleString()} kcal
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Tally ---------- */
function Tally({
  label,
  value,
  signed,
  color,
}: {
  label: string;
  value: number;
  signed?: boolean;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p className="display text-2xl font-light" style={{ color }}>
        {signed && value > 0 ? "+" : ""}
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

interface GoalRow {
  key: string;
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  Icon: (p: React.SVGProps<SVGSVGElement> & { size?: number }) => React.JSX.Element;
  invert?: boolean;
}

/* ---------- Live tracker widget (iOS live-activity / lock-screen style) ---------- */
function LiveTracker({ goals }: { goals: GoalRow[] }) {
  return (
    <div className="card overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="leading-tight">
          <p className="text-sm font-bold">Today&apos;s tracker</p>
          <p className="text-[10px] text-muted">MyHealth · live</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Live
          </span>
        </span>
      </div>

      {/* rows */}
      <div className="space-y-4 px-5 py-4">
        {goals.map((g) => {
          const pct = g.max > 0 ? Math.min(g.value / g.max, 1) : 0;
          const over = g.invert && g.value > g.max;
          const color = over ? "var(--danger)" : g.color;
          return (
            <div key={g.key} className="flex items-center gap-3">
              <span style={{ color }}>
                <g.Icon size={18} />
              </span>
              <span className="w-16 shrink-0 text-xs font-semibold text-muted">
                {g.label}
              </span>
              <div className="flex-1">
                <SegmentBar pct={pct} color={color} />
              </div>
              <span className="display w-20 shrink-0 text-right text-xs">
                {Math.round(g.value).toLocaleString()}
                <span className="text-[10px] text-muted">
                  /{Math.round(g.max).toLocaleString()}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* dotted / segmented progress bar (Box Box style) */
function SegmentBar({ pct, color }: { pct: number; color: string }) {
  const SEGMENTS = 16;
  const filled = Math.round(Math.min(Math.max(pct, 0), 1) * SEGMENTS);
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const on = i < filled;
        return (
          <span
            key={i}
            className="h-3.5 w-1.5 rounded-full transition-all"
            style={{
              background: on ? color : "var(--surface-3)",
              opacity: on ? 1 : 0.6,
              boxShadow: on ? `0 0 3px ${color}55` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Journey progress (Box Box "% completed" widget) ---------- */
function JourneyProgress({
  pct,
  changed,
  total,
  losing,
  kmTotal,
  daysTracked,
  reachLabel,
}: {
  pct: number;
  changed: number;
  total: number;
  losing: boolean;
  kmTotal: number;
  daysTracked: number;
  reachLabel: string | null;
}) {
  const SEGMENTS = 24;
  const filled = Math.round(pct * SEGMENTS);
  const green = "#34d399";
  return (
    <div className="card overflow-hidden p-6">
      {/* big % + caption */}
      <div className="flex items-baseline gap-3">
        <span className="display text-5xl font-light" style={{ color: green }}>
          {Math.round(pct * 100)}%
        </span>
        <span className="text-sm font-semibold leading-tight text-muted">
          {changed.toFixed(1)} of {total.toFixed(1)} kg
          <br />
          {losing ? "lost" : "gained"}
        </span>
      </div>

      {/* segmented bars */}
      <div className="mt-5 flex items-end gap-[3px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className="flex-1 rounded-full transition-all"
            style={{
              height: 28,
              background: i < filled ? green : "var(--surface-3)",
              opacity: i < filled ? 1 : 0.6,
            }}
          />
        ))}
      </div>

      {/* two icon stats */}
      <div className="mt-6 flex items-center justify-between">
        <Stat icon={<RouteIcon color={green} />} value={`${daysTracked}`} label="Days Tracked" color={green} />
        <Stat icon={<PathIcon color={green} />} value={`${kmTotal.toFixed(1)}`} label="Kms Covered" color={green} />
      </div>

      {reachLabel && (
        <p className="mt-4 text-xs text-muted">
          On pace to reach your goal by{" "}
          <span style={{ color: green }}>{reachLabel}</span>
        </p>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div className="leading-tight">
        <p className="display text-2xl font-light" style={{ color }}>
          {value}
        </p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ---------- 14-day activity (per-round bar chart style) ---------- */
function ActivityBars({
  bars,
  target,
  streak,
}: {
  bars: { date: string; value: number; isToday: boolean; has: boolean }[];
  target: number;
  streak: number;
}) {
  const max = Math.max(target, ...bars.map((b) => b.value), 1);
  const logged = bars.filter((b) => b.has).length;
  return (
    <div className="card overflow-hidden p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Last 14 days
          </p>
          <p className="display mt-1.5 text-3xl font-light">
            {logged}
            <span className="ml-1 text-sm font-normal text-muted">
              days logged
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="display text-2xl font-light text-accent-2">{streak}</p>
          <p className="text-[11px] text-muted">day streak</p>
        </div>
      </div>

      <div className="flex h-28 items-end gap-1.5">
        {bars.map((b) => {
          const px = b.value > 0 ? Math.max(8, (b.value / max) * 96) : 5;
          const color = b.isToday
            ? "var(--motiv)"
            : b.has
              ? "var(--accent)"
              : "var(--surface-3)";
          return (
            <div key={b.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className="w-full rounded-md transition-all"
                style={{
                  height: `${px}px`,
                  background: color,
                  opacity: b.has || b.isToday ? 1 : 0.5,
                }}
              />
              <span
                className="text-[8px] tabular-nums"
                style={{ color: b.isToday ? "var(--motiv)" : "var(--muted)" }}
              >
                {b.date.slice(8)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10px] text-muted">
        <Legend color="var(--accent)" label="Logged" />
        <Legend color="var(--motiv)" label="Today" />
        <Legend color="var(--surface-3)" label="No data" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function RouteIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 000-8H10a4 4 0 010-8h6" />
    </svg>
  );
}

function PathIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3c3 0 3 4 6 4s3-4 6-4M5 10c3 0 3 4 6 4s3-4 6-4M5 17c3 0 3 4 6 4s3-4 6-4" />
    </svg>
  );
}

/* ---------- Motivational comment (yellow, Box Box style) ---------- */
function Motivation({
  message,
}: {
  message: { lead: string; highlight: string; tail?: string };
}) {
  return (
    <p className="px-1 text-xl font-extrabold leading-snug tracking-tight">
      {message.lead}{" "}
      <span style={{ color: "var(--motiv)" }}>{message.highlight}</span>
      {message.tail ? ` ${message.tail}` : ""}
    </p>
  );
}

function motivationFor(
  goals: GoalRow[],
  remaining: number
): { lead: string; highlight: string; tail?: string } {
  const by = (k: string) => goals.find((g) => g.key === k);
  const steps = by("steps");
  const water = by("water");
  const protein = by("protein");
  const sugar = by("sugar");

  const stepsPct = steps && steps.max ? steps.value / steps.max : 0;
  const waterPct = water && water.max ? water.value / water.max : 0;
  const proteinPct = protein && protein.max ? protein.value / protein.max : 0;
  const sugarOver = sugar ? sugar.value > sugar.max : false;

  if (sugarOver) {
    return { lead: "Sugar's a bit high —", highlight: "ease off", tail: "the sweets today." };
  }
  if (stepsPct >= 1) {
    return { lead: "Step goal smashed.", highlight: "You're unstoppable!" };
  }
  if (waterPct < 0.4) {
    return { lead: "Hydrate up —", highlight: "your body will thank you." };
  }
  if (proteinPct >= 1) {
    return { lead: "Protein on point.", highlight: "Muscles fueled!" };
  }
  if (remaining > 0 && remaining < 300) {
    return { lead: "Almost at your target —", highlight: "finish strong." };
  }
  if (stepsPct >= 0.6) {
    return { lead: "Great pace today.", highlight: "Keep moving!" };
  }
  return { lead: "A little progress is", highlight: "still progress.", tail: "Let's go!" };
}

/* ---------- Mini stat ---------- */
function MiniCard({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint: string;
}) {
  return (
    <div className="card p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="display mt-1.5 text-2xl font-light" style={{ color: tint }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted">{sub}</p>
    </div>
  );
}
