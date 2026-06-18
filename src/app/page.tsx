"use client";

import Link from "next/link";
import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import {
  bmi,
  bmiCategory,
  formatReachDate,
  projectWeight,
  tdee,
} from "@/lib/health";

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
    while (set.has(d.toISOString().slice(0, 10))) {
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

  const goals: GoalRow[] = [
    {
      key: "steps",
      label: "Steps",
      value: todayLog.steps,
      max: profile.daily_step_goal,
      unit: "",
      color: "#3b82f6",
      icon: "👟",
    },
    {
      key: "protein",
      label: "Protein",
      value: todayLog.protein_g,
      max: profile.daily_protein_goal_g,
      unit: "g",
      color: "#34d399",
      icon: "🥩",
    },
    {
      key: "water",
      label: "Water",
      value: todayLog.water_ml,
      max: profile.daily_water_goal_ml,
      unit: "ml",
      color: "#38bdf8",
      icon: "💧",
    },
    {
      key: "sugar",
      label: "Sugar",
      value: todayLog.sugar_g,
      max: profile.daily_sugar_limit_g,
      unit: "g",
      color: "#818cf8",
      icon: "🍬",
      invert: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ===== Hero: calorie ring ===== */}
      <section className="rise-in flex flex-col items-center pt-2">
        <HeroRing
          value={todayLog.calories_intake}
          max={profile.daily_calorie_target}
        />
        <p className="mt-5 text-sm text-muted">
          {remaining > 0 ? (
            <>
              <span className="font-semibold text-foreground">
                {remaining.toLocaleString()} kcal
              </span>{" "}
              left today
            </>
          ) : (
            <span className="font-semibold text-danger">
              Daily target reached
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

      {/* ===== Journey to goal ===== */}
      <Link href="/progress" className="card rise-in block p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Journey to goal
            </p>
            <p className="display mt-2 text-4xl font-light">
              {Math.abs(toGo).toFixed(1)}
              <span className="ml-1 text-base font-normal text-muted">
                kg to go
              </span>
            </p>
            {reachDate ? (
              <p className="mt-2 text-xs text-accent-2">
                Est.{" "}
                {reachDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Log meals to forecast your goal date
              </p>
            )}
          </div>
          <span className="chip" style={{ background: "#3b82f622" }}>
            <Arrow />
          </span>
        </div>
      </Link>

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

/* ---------- Hero ring ---------- */
function HeroRing({ value, max }: { value: number; max: number }) {
  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = c * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#38bdf8" />
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
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-5xl font-light">
          {Math.round(value).toLocaleString()}
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
          of {max.toLocaleString()} kcal
        </span>
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
  icon: string;
  invert?: boolean;
}

/* ---------- Live tracker widget (iOS live-activity / lock-screen style) ---------- */
function LiveTracker({ goals }: { goals: GoalRow[] }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface-2">
      {/* header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="chip h-8 w-8 rounded-xl bg-accent text-sm font-extrabold text-white">
            MH
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Today&apos;s tracker</p>
            <p className="text-[10px] text-muted">MyHealth · live</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Live
          </span>
        </span>
      </div>

      {/* rows */}
      <div className="space-y-3.5 px-5 py-4">
        {goals.map((g) => {
          const pct = g.max > 0 ? Math.min(g.value / g.max, 1) : 0;
          const over = g.invert && g.value > g.max;
          const color = over ? "var(--danger)" : g.color;
          return (
            <div key={g.key} className="flex items-center gap-3">
              <span className="w-5 text-center text-base">{g.icon}</span>
              <span className="w-16 shrink-0 text-xs font-semibold text-muted">
                {g.label}
              </span>
              <div className="tower-bar flex-1">
                <div
                  className="tower-fill"
                  style={{ width: `${pct * 100}%`, background: color }}
                />
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

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#3b82f6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
