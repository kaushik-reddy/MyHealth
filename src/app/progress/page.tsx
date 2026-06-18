"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import {
  formatReachDate,
  projectWeight,
  tdee,
} from "@/lib/health";
import { MOODS } from "@/components/icons";

export default function ProgressPage() {
  return (
    <AppShell title="Progress" subtitle="Trends & goal plan">
      <Progress />
    </AppShell>
  );
}

function Progress() {
  const { profile, logs, weights, moods } = useStore();
  if (!profile) return null;

  const recent = logs.slice(-14).filter((l) => l.calories_intake > 0);
  const avgIntake =
    recent.length > 0
      ? recent.reduce((s, l) => s + l.calories_intake, 0) / recent.length
      : profile.daily_calorie_target;
  const avgBurn =
    recent.length > 0
      ? recent.reduce((s, l) => s + l.active_calories, 0) / recent.length
      : 200;

  const { points, reachDays } = projectWeight(profile, avgIntake, avgBurn);
  const reachDate = formatReachDate(reachDays);

  // Merge projection with actual recorded weights for the chart.
  const data = useMemo(() => {
    const byDate = new Map(weights.map((w) => [w.entry_date, w.weight_kg]));
    // sample projection to ~weekly points to keep the chart readable.
    const sampled = points.filter((_, i) => i % 7 === 0 || i === points.length - 1);
    return sampled.map((p) => ({
      date: p.date,
      label: new Date(p.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      projected: p.weight,
      goal: p.target,
      actual: byDate.get(p.date) ?? null,
    }));
  }, [points, weights]);

  const maintenance = tdee(
    profile.sex,
    profile.current_weight_kg,
    profile.height_cm,
    profile.age,
    profile.activity_level
  );
  const dailyDeficit = Math.round(maintenance + avgBurn - avgIntake);

  const weightSeries = weights.slice(-30);

  // ----- last-14-day series for calorie / sugar / steps bar charts -----
  const last14 = useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.log_date, l]));
    const out: {
      label: string;
      calories: number;
      sugar: number;
      steps: number;
    }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const log = byDate.get(key);
      out.push({
        label: d.toLocaleDateString(undefined, { day: "numeric" }),
        calories: log?.calories_intake ?? 0,
        sugar: log?.sugar_g ?? 0,
        steps: log?.steps ?? 0,
      });
    }
    return out;
  }, [logs]);

  // ----- mood distribution (last 30 days) -----
  const moodDist = useMemo(() => {
    const counts: Record<string, number> = { great: 0, ok: 0, tired: 0, bad: 0 };
    moods.forEach((m) => {
      counts[m.mood] = (counts[m.mood] ?? 0) + 1;
    });
    return MOODS.map((m) => ({
      label: m.label,
      value: counts[m.value] ?? 0,
      color: m.color,
    }));
  }, [moods]);
  const moodTotal = moodDist.reduce((s, m) => s + m.value, 0);

  return (
    <div className="space-y-5">
      {/* ETA hero */}
      <div className="card relative overflow-hidden p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Estimated goal date
        </p>
        {reachDate ? (
          <>
            <p className="display mt-2 text-3xl font-light text-accent-2">
              {reachDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="mt-1 text-xs text-muted">
              ~{reachDays} days · {Math.round((reachDays! / 7) * 10) / 10} weeks at your current pace
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {dailyDeficit <= 0 && profile.goal_type === "lose"
              ? "You're in a surplus — log fewer calories or move more to start the countdown."
              : "Log a few days of meals to project your goal date."}
          </p>
        )}
      </div>

      {/* Calories last 14 days */}
      <ChartCard title="Calories — last 14 days" hint={`target ${profile.daily_calorie_target} kcal`}>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={last14} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#1e1e25" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP} labelStyle={{ color: "#8a8f9e" }} />
            <ReferenceLine y={profile.daily_calorie_target} stroke="#facc15" strokeDasharray="4 4" />
            <Bar dataKey="calories" radius={[5, 5, 0, 0]}>
              {last14.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.calories === 0
                      ? "#1a1a20"
                      : d.calories <= profile.daily_calorie_target
                        ? "#3b82f6"
                        : "#f87171"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sugar last 14 days */}
      <ChartCard title="Sugar — last 14 days" hint={`limit ${profile.daily_sugar_limit_g} g`}>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={last14} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="sugar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e1e25" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP} labelStyle={{ color: "#8a8f9e" }} />
            <ReferenceLine y={profile.daily_sugar_limit_g} stroke="#f87171" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="sugar" stroke="#a5b4fc" strokeWidth={2} fill="url(#sugar)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Steps last 14 days */}
      <ChartCard title="Steps — last 14 days" hint={`goal ${profile.daily_step_goal.toLocaleString()}`}>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={last14} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#1e1e25" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fill: "#8a8f9e", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP} labelStyle={{ color: "#8a8f9e" }} />
            <ReferenceLine y={profile.daily_step_goal} stroke="#facc15" strokeDasharray="4 4" />
            <Bar dataKey="steps" radius={[5, 5, 0, 0]}>
              {last14.map((d, i) => (
                <Cell key={i} fill={d.steps === 0 ? "#1a1a20" : "#38bdf8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Mood distribution */}
      {moodTotal > 0 && (
        <ChartCard title="Mood check-ins" hint={`${moodTotal} logged`}>
          <div className="space-y-3 pt-1">
            {moodDist.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs font-semibold" style={{ color: m.color }}>
                  {m.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${moodTotal ? (m.value / moodTotal) * 100 : 0}%`,
                      background: m.color,
                    }}
                  />
                </div>
                <span className="display w-8 shrink-0 text-right text-sm">{m.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Weight projection chart */}
      <ChartCard title="Weight projection">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e1e25" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8a8f9e", fontSize: 10 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: "#1e1e25" }}
            />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{ fill: "#8a8f9e", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP}
              labelStyle={{ color: "#8a8f9e" }}
            />
            <ReferenceLine
              y={profile.goal_weight_kg}
              stroke="#f87171"
              strokeDasharray="4 4"
              label={{ value: "Goal", fill: "#f87171", fontSize: 10, position: "insideTopRight" }}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#proj)"
              name="Projected"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#38bdf8" }}
              connectNulls
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted">
          <Legend color="#3b82f6" label="Projected" />
          <Legend color="#38bdf8" label="Actual weigh-ins" />
          <Legend color="#f87171" label="Goal" />
        </div>
      </ChartCard>

      {/* Strategy stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Avg intake" value={`${Math.round(avgIntake)}`} unit="kcal/day" />
        <Stat label="Maintenance" value={`${maintenance}`} unit="kcal/day" />
        <Stat
          label="Daily deficit"
          value={`${dailyDeficit > 0 ? "+" : ""}${dailyDeficit}`}
          unit="kcal"
          tint={dailyDeficit > 0 ? "var(--green)" : "var(--accent)"}
        />
        <Stat
          label="Weekly change"
          value={`${Math.round((dailyDeficit * 7 / 7700) * 100) / 100}`}
          unit="kg/wk"
        />
      </div>

      {/* Recorded weights */}
      <ChartCard title="Recent weigh-ins">
        {weightSeries.length === 0 ? (
          <p className="text-xs text-muted">
            Log your weight on the Check-in tab to build this trend.
          </p>
        ) : (
          <div className="space-y-1.5">
            {weightSeries
              .slice()
              .reverse()
              .map((w, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? w.weight_kg - prev.weight_kg : 0;
                return (
                  <div
                    key={w.entry_date}
                    className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0"
                  >
                    <span className="text-xs text-muted">
                      {new Date(w.entry_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="display text-sm">
                        {w.weight_kg} kg
                      </span>
                      {prev && (
                        <span
                          className="display w-12 text-right text-xs"
                          style={{
                            color: diff <= 0 ? "var(--green)" : "var(--danger)",
                          }}
                        >
                          {diff > 0 ? "+" : ""}
                          {Math.round(diff * 10) / 10}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

const TOOLTIP = {
  background: "#101013",
  border: "1px solid #1e1e25",
  borderRadius: 12,
  fontSize: 12,
} as const;

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  unit,
  tint,
}: {
  label: string;
  value: string;
  unit: string;
  tint?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="display mt-1 text-xl font-light" style={{ color: tint }}>
        {value}
      </p>
      <p className="text-[10px] text-muted">{unit}</p>
    </div>
  );
}
