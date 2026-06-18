"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { tdee, todayKey } from "@/lib/health";
import type { DailyLog } from "@/lib/types";

export default function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Your daily history">
      <CalendarView />
    </AppShell>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarView() {
  const { profile, logs } = useStore();
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string>(today);

  const logByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    logs.forEach((l) => map.set(l.log_date, l));
    return map;
  }, [logs]);

  if (!profile) return null;

  const first = new Date(cursor.year, cursor.month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push(key);
  }

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      const year = c.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  };

  const selectedLog = logByDate.get(selected);

  return (
    <div className="space-y-5">
      {/* Month switcher */}
      <div className="card flex items-center justify-between p-2">
        <button
          onClick={() => shiftMonth(-1)}
          className="h-9 w-9 rounded-lg border border-border bg-surface-2 text-lg font-bold active:scale-95"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-bold uppercase tracking-wide">{monthLabel}</p>
        <button
          onClick={() => shiftMonth(1)}
          className="h-9 w-9 rounded-lg border border-border bg-surface-2 text-lg font-bold active:scale-95"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Month grid */}
      <div className="card p-3">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="text-center text-[10px] font-bold uppercase text-muted">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((key, i) => {
            if (!key) return <div key={i} />;
            const log = logByDate.get(key);
            const active = !!log && (log.calories_intake || log.steps || log.water_ml);
            const isToday = key === today;
            const isSel = key === selected;
            const future = key > today;
            const dayNum = Number(key.slice(8));
            return (
              <button
                key={key}
                disabled={future}
                onClick={() => setSelected(key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs transition ${
                  isSel
                    ? "border-accent bg-accent/15"
                    : "border-border bg-surface-2"
                } ${future ? "opacity-25" : "active:scale-95"}`}
              >
                <span className={`mono ${isToday ? "font-black text-accent" : "font-semibold"}`}>
                  {dayNum}
                </span>
                <span
                  className="mt-0.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: active ? "var(--accent-2)" : "transparent" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day summary */}
      <DaySummary
        date={selected}
        log={selectedLog}
        maintenance={tdee(
          profile.sex,
          profile.current_weight_kg,
          profile.height_cm,
          profile.age,
          profile.activity_level
        )}
        target={profile.daily_calorie_target}
        stepGoal={profile.daily_step_goal}
        waterGoal={profile.daily_water_goal_ml}
        sugarLimit={profile.daily_sugar_limit_g}
      />
    </div>
  );
}

function DaySummary({
  date,
  log,
  maintenance,
  target,
  stepGoal,
  waterGoal,
  sugarLimit,
}: {
  date: string;
  log: DailyLog | undefined;
  maintenance: number;
  target: number;
  stepGoal: number;
  waterGoal: number;
  sugarLimit: number;
}) {
  const d = new Date(date + "T00:00:00");
  const nice = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const net = log ? log.calories_intake - (maintenance + log.active_calories) : 0;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">{nice}</h2>
          <p className="text-[11px] text-muted">
            {log ? "What you logged" : "Nothing logged yet"}
          </p>
        </div>
        <Link
          href={`/checkin?date=${date}`}
          className="rounded-lg bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition active:scale-95"
        >
          {log ? "Edit day" : "Add data"}
        </Link>
      </div>

      {log ? (
        <div className="space-y-2">
          <Row label="🍽️ Eaten" value={`${Math.round(log.calories_intake)} kcal`} sub={`goal ${target}`} />
          <Row label="🚶 Steps" value={log.steps.toLocaleString()} sub={`goal ${stepGoal.toLocaleString()} · ${log.distance_km.toFixed(1)} km`} />
          <Row label="🔥 Workout burn" value={`${Math.round(log.active_calories)} kcal`} />
          <Row label="🍬 Sugar" value={`${log.sugar_g} g`} sub={`limit ${sugarLimit} g`} />
          <Row label="🥩 Protein" value={`${Math.round(log.protein_g)} g`} />
          <Row label="💧 Water" value={`${log.water_ml} ml`} sub={`goal ${waterGoal} ml`} />
          {log.weight_kg ? <Row label="⚖️ Weight" value={`${log.weight_kg} kg`} /> : null}
          {log.mood ? <Row label="🙂 Mood" value={log.mood} /> : null}
          {log.notes ? (
            <p className="rounded-lg border border-border bg-surface-2 p-2 text-xs text-muted">
              “{log.notes}”
            </p>
          ) : null}
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
            <span className="text-xs text-muted">Energy balance</span>
            <span
              className="mono text-sm font-bold"
              style={{ color: net <= 0 ? "var(--green)" : "var(--danger)" }}
            >
              {net > 0 ? "+" : ""}
              {Math.round(net)} kcal
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Tap <span className="font-semibold text-accent">Add data</span> to log meals,
          steps, water and more for this day.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-sm">{label}</span>
      <span className="text-right">
        <span className="mono text-sm font-bold">{value}</span>
        {sub && <span className="block text-[10px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}
