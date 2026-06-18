"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

export default function ProgressPage() {
  return (
    <AppShell title="Progress" subtitle="Telemetry & race strategy">
      <Progress />
    </AppShell>
  );
}

function Progress() {
  const { profile, logs, weights } = useStore();
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

  return (
    <div className="space-y-4">
      {/* ETA hero */}
      <div className="card relative overflow-hidden p-5">
        <div className="speed-tab absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Estimated finish line
          </p>
          {reachDate ? (
            <>
              <p className="mono text-2xl font-black text-accent-2">
                {reachDate.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted">
                ~{reachDays} days · {Math.round((reachDays! / 7) * 10) / 10} weeks at your current pace
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              {dailyDeficit <= 0 && profile.goal_type === "lose"
                ? "You're in a surplus — log fewer calories or move more to start the countdown."
                : "Log a few days of meals to project your finish line."}
            </p>
          )}
        </div>
      </div>

      {/* Projection chart */}
      <div className="card p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest">
          Weight projection
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e0d1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00e0d1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2e36" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8b909a", fontSize: 10 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: "#2a2e36" }}
            />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{ fill: "#8b909a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#131519",
                border: "1px solid #2a2e36",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#8b909a" }}
            />
            <ReferenceLine
              y={profile.goal_weight_kg}
              stroke="#e10600"
              strokeDasharray="4 4"
              label={{ value: "Goal", fill: "#e10600", fontSize: 10, position: "insideTopRight" }}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#00e0d1"
              strokeWidth={2}
              fill="url(#proj)"
              name="Projected"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ r: 3, fill: "#fbbf24" }}
              connectNulls
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted">
          <Legend color="#00e0d1" label="Projected" />
          <Legend color="#fbbf24" label="Actual weigh-ins" />
          <Legend color="#e10600" label="Goal" />
        </div>
      </div>

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
      <div className="card p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest">
          Recent weigh-ins
        </h2>
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
                      <span className="mono text-sm font-bold">
                        {w.weight_kg} kg
                      </span>
                      {prev && (
                        <span
                          className="mono w-12 text-right text-xs"
                          style={{
                            color: diff <= 0 ? "var(--green)" : "var(--accent)",
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
      </div>
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
    <div className="card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mono text-xl font-black" style={{ color: tint }}>
        {value}
      </p>
      <p className="text-[10px] text-muted">{unit}</p>
    </div>
  );
}
