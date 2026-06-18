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
    <AppShell title="Paddock" subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { profile, todayLog, logs } = useStore();
  if (!profile) return null;

  const maintenance = tdee(
    profile.sex,
    profile.current_weight_kg,
    profile.height_cm,
    profile.age,
    profile.activity_level
  );
  const burned = maintenance + todayLog.active_calories;
  const net = todayLog.calories_intake - burned;
  const bmiVal = bmi(profile.current_weight_kg, profile.height_cm);
  const bmiCat = bmiCategory(bmiVal);

  // 14-day averages for projection.
  const recent = useMemo(() => logs.slice(-14).filter((l) => l.calories_intake > 0), [logs]);
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

  // streak: consecutive days with any log ending today.
  const streak = useMemo(() => {
    const set = new Set(logs.filter((l) => l.steps || l.calories_intake || l.water_ml).map((l) => l.log_date));
    let s = 0;
    const d = new Date();
    while (set.has(d.toISOString().slice(0, 10))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [logs]);

  const toGo = profile.current_weight_kg - profile.goal_weight_kg;

  // Build timing-tower rows (sorted by completion, like a live leaderboard).
  const rows: TowerRow[] = [
    {
      key: "intake",
      label: "Calories",
      sub: "intake vs target",
      value: todayLog.calories_intake,
      max: profile.daily_calorie_target,
      unit: "kcal",
      color: "var(--accent)",
    },
    {
      key: "steps",
      label: "Steps",
      sub: `${todayLog.distance_km.toFixed(1)} km walked`,
      value: todayLog.steps,
      max: profile.daily_step_goal,
      unit: "",
      color: "var(--accent-2)",
    },
    {
      key: "protein",
      label: "Protein",
      sub: "muscle fuel",
      value: todayLog.protein_g,
      max: profile.daily_protein_goal_g,
      unit: "g",
      color: "var(--green)",
    },
    {
      key: "water",
      label: "Water",
      sub: "hydration",
      value: todayLog.water_ml,
      max: profile.daily_water_goal_ml,
      unit: "ml",
      color: "var(--purple)",
    },
    {
      key: "sugar",
      label: "Sugar",
      sub: "stay under the limit",
      value: todayLog.sugar_g,
      max: profile.daily_sugar_limit_g,
      unit: "g",
      color: "var(--pink)",
      invert: true,
    },
  ];
  const ranked = rows
    .map((r) => ({ ...r, pct: r.max > 0 ? r.value / r.max : 0 }))
    .sort((a, b) =>
      (a.invert ? 1 - a.pct : b.pct) - (a.invert ? 1 - b.pct : a.pct)
    );

  return (
    <div className="space-y-4">
      {/* Lock-screen style live "race progress" notification */}
      <div className="card rise-in overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="speed-tab flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="mono text-sm font-extrabold text-white">MH</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold">Race progress</p>
              <p className="text-[10px] text-muted">MyHealth · now</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-3 px-2 py-1">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Live
            </span>
          </span>
        </div>

        <div className="space-y-2.5">
          {ranked.map((r, i) => (
            <TowerRowView key={r.key} pos={i + 1} row={r} />
          ))}
        </div>
      </div>

      {/* Energy balance */}
      <div className="card rise-in relative overflow-hidden p-5">
        <div className="speed-tab absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Energy balance
            </p>
            <p
              className="mono text-3xl font-extrabold"
              style={{ color: net <= 0 ? "var(--green)" : "var(--danger)" }}
            >
              {net > 0 ? "+" : ""}
              {Math.round(net)}
            </p>
            <p className="text-xs text-muted">
              {net <= 0 ? "Deficit — on track 💧" : "Surplus — ease off"}
            </p>
          </div>
          <div className="text-right text-xs">
            <Row label="In" value={`${Math.round(todayLog.calories_intake)}`} />
            <Row label="Burn" value={`${Math.round(burned)}`} />
            <Row label="Goal" value={`${profile.daily_calorie_target}`} />
          </div>
        </div>
      </div>

      {/* Projection summary */}
      <Link href="/progress" className="card rise-in block p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Race to goal
            </p>
            <p className="mono text-2xl font-extrabold">
              {Math.abs(toGo).toFixed(1)}
              <span className="text-sm font-medium text-muted"> kg to go</span>
            </p>
            {reachDate ? (
              <p className="text-xs text-accent-2">
                ETA {reachDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                {reachDays !== null && ` · ${reachDays}d`}
              </p>
            ) : (
              <p className="text-xs text-muted">
                Log meals to forecast your finish line
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl">🏁</span>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
              View chart →
            </p>
          </div>
        </div>
      </Link>

      {/* mini stats row */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard label="BMI" value={bmiVal.toFixed(1)} tint={bmiCat.color} sub={bmiCat.label} />
        <MiniCard label="Streak" value={`${streak}`} tint="var(--accent-3)" sub="days" />
        <MiniCard
          label="Distance"
          value={todayLog.distance_km.toFixed(1)}
          tint="var(--accent-2)"
          sub="km today"
        />
      </div>

      <Link
        href="/checkin"
        className="block rounded-xl bg-accent py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
      >
        + Daily check-in
      </Link>
    </div>
  );
}

interface TowerRow {
  key: string;
  label: string;
  sub: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  invert?: boolean;
}

function TowerRowView({ pos, row }: { pos: number; row: TowerRow & { pct?: number } }) {
  const pct = row.max > 0 ? row.value / row.max : 0;
  const over = row.invert && row.value > row.max;
  const fillColor = over ? "var(--danger)" : row.color;
  return (
    <div className="flex items-center gap-3">
      <span
        className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
        style={{ background: `${fillColor}22`, color: fillColor }}
      >
        {pos}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-semibold">{row.label}</span>
          <span className="mono shrink-0 text-xs font-bold">
            {Math.round(row.value).toLocaleString()}
            <span className="text-[10px] font-normal text-muted">
              /{Math.round(row.max).toLocaleString()}
              {row.unit && ` ${row.unit}`}
            </span>
          </span>
        </div>
        <div className="tower-bar">
          <div
            className="tower-fill"
            style={{
              width: `${Math.min(pct, 1) * 100}%`,
              background: `linear-gradient(90deg, ${fillColor}, color-mix(in srgb, ${fillColor} 60%, white))`,
            }}
          />
          <div className="tower-ticks" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-muted">{label}</span>
      <span className="mono w-12 text-right font-bold">{value}</span>
    </div>
  );
}

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
    <div className="card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mono text-xl font-black" style={{ color: tint }}>
        {value}
      </p>
      <p className="text-[10px] text-muted">{sub}</p>
    </div>
  );
}
