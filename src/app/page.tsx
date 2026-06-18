"use client";

import Link from "next/link";
import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import Ring from "@/components/Ring";
import { useStore } from "@/lib/store";
import {
  bmi,
  bmiCategory,
  formatReachDate,
  projectWeight,
  tdee,
  todayKey,
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

  return (
    <div className="space-y-4">
      {/* Hero — net energy */}
      <div className="card relative overflow-hidden p-5">
        <div className="speed-tab absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Energy balance
            </p>
            <p
              className="mono text-3xl font-black"
              style={{ color: net <= 0 ? "var(--green)" : "var(--accent)" }}
            >
              {net > 0 ? "+" : ""}
              {Math.round(net)}
            </p>
            <p className="text-xs text-muted">
              {net <= 0 ? "Deficit — losing 🔥" : "Surplus — gaining"}
            </p>
          </div>
          <div className="text-right text-xs">
            <Row label="In" value={`${Math.round(todayLog.calories_intake)}`} />
            <Row label="Burn" value={`${Math.round(burned)}`} />
            <Row label="Goal" value={`${profile.daily_calorie_target}`} />
          </div>
        </div>
      </div>

      {/* Activity rings */}
      <div className="card grid grid-cols-2 gap-2 p-4">
        <RingStat
          value={todayLog.calories_intake}
          max={profile.daily_calorie_target}
          unit="kcal"
          label="Intake"
          color="var(--accent)"
        />
        <RingStat
          value={todayLog.steps}
          max={profile.daily_step_goal}
          unit="steps"
          label="Steps"
          color="var(--accent-2)"
        />
        <RingStat
          value={todayLog.sugar_g}
          max={profile.daily_sugar_limit_g}
          unit="g sugar"
          label="Sugar"
          color="var(--pink)"
          invert
        />
        <RingStat
          value={todayLog.water_ml}
          max={profile.daily_water_goal_ml}
          unit="ml"
          label="Water"
          color="var(--purple)"
        />
      </div>

      {/* Projection summary */}
      <Link href="/progress" className="card block p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Race to goal
            </p>
            <p className="mono text-2xl font-black">
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
        className="block rounded-xl bg-accent py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white"
      >
        + Daily check-in
      </Link>
    </div>
  );
}

function RingStat({
  value,
  max,
  unit,
  label,
  color,
  invert,
}: {
  value: number;
  max: number;
  unit: string;
  label: string;
  color: string;
  invert?: boolean;
}) {
  const over = invert && value > max;
  return (
    <div className="flex flex-col items-center py-2">
      <Ring value={value} max={max} color={over ? "var(--accent)" : color} size={104} stroke={9}>
        <span className="mono text-lg font-bold leading-none">
          {Math.round(value)}
        </span>
        <span className="text-[9px] uppercase tracking-wide text-muted">{unit}</span>
      </Ring>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
        {over && <span className="text-accent"> · over</span>}
      </span>
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
