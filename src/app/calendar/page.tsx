"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { dayProgress, progressColor, tdee, todayKey } from "@/lib/health";
import type { DailyLog, MoodEntry } from "@/lib/types";
import {
  MealIcon,
  StepsIcon,
  FlameIcon,
  SugarIcon,
  ProteinIcon,
  WaterIcon,
  ScaleIcon,
  ChevronLeft,
  ChevronRight,
  MOODS,
} from "@/components/icons";

export default function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Your daily history">
      <CalendarView />
    </AppShell>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarView() {
  const { profile, logs, moods } = useStore();
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
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 p-2.5">
        <button
          onClick={() => shiftMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-muted active:scale-90"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-sm font-bold uppercase tracking-wide">{monthLabel}</p>
        <button
          onClick={() => shiftMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-muted active:scale-90"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
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
            const isToday = key === today;
            const isSel = key === selected;
            const future = key > today;
            const dayNum = Number(key.slice(8));
            const pct = dayProgress(log, profile);
            return (
              <button
                key={key}
                disabled={future}
                onClick={() => setSelected(key)}
                className={`relative flex aspect-square items-center justify-center rounded-lg border transition ${
                  isSel
                    ? "border-accent bg-accent/15"
                    : "border-transparent"
                } ${future ? "opacity-25" : "active:scale-95"}`}
              >
                <DayRing
                  pct={pct}
                  num={dayNum}
                  isToday={isToday}
                  complete={pct >= 1}
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
        moods={moods.filter((m) => m.log_date === selected)}
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

function DayRing({
  pct,
  num,
  isToday,
  complete,
}: {
  pct: number;
  num: number;
  isToday: boolean;
  complete: boolean;
}) {
  const size = 38;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(pct, 0), 1);
  const offset = c * (1 - clamped);
  const color = progressColor(clamped);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        {clamped > 0 && (
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
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)",
              filter: complete ? `drop-shadow(0 0 2px ${color}99)` : "none",
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {complete ? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#34d399"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span
            className={`mono text-xs ${
              isToday ? "font-black text-accent" : "font-semibold text-foreground"
            }`}
          >
            {num}
          </span>
        )}
      </div>
    </div>
  );
}

function DaySummary({
  date,
  log,
  moods,
  maintenance,
  target,
  stepGoal,
  waterGoal,
  sugarLimit,
}: {
  date: string;
  log: DailyLog | undefined;
  moods: MoodEntry[];
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
  const hasAnything = !!log || moods.length > 0;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">{nice}</h2>
          <p className="text-[11px] text-muted">
            {hasAnything ? "What you logged" : "Nothing logged yet"}
          </p>
        </div>
        <Link
          href={`/checkin?date=${date}`}
          className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition active:scale-95"
        >
          {hasAnything ? "Edit day" : "Add data"}
        </Link>
      </div>

      {log ? (
        <div className="space-y-1">
          <Row Icon={MealIcon} color="#3b82f6" label="Eaten" value={`${Math.round(log.calories_intake)} kcal`} sub={`goal ${target}`} />
          <Row Icon={StepsIcon} color="#38bdf8" label="Steps" value={log.steps.toLocaleString()} sub={`goal ${stepGoal.toLocaleString()} · ${log.distance_km.toFixed(1)} km`} />
          <Row Icon={FlameIcon} color="#f59e0b" label="Workout burn" value={`${Math.round(log.active_calories)} kcal`} />
          <Row Icon={SugarIcon} color="#a5b4fc" label="Sugar" value={`${log.sugar_g} g`} sub={`limit ${sugarLimit} g`} />
          <Row Icon={ProteinIcon} color="#34d399" label="Protein" value={`${Math.round(log.protein_g)} g`} />
          <Row Icon={WaterIcon} color="#60a5fa" label="Water" value={`${log.water_ml} ml`} sub={`goal ${waterGoal} ml`} />
          {log.weight_kg ? <Row Icon={ScaleIcon} color="#e6c073" label="Weight" value={`${log.weight_kg} kg`} /> : null}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-3 px-4 py-3">
            <span className="text-xs text-muted">Energy balance</span>
            <span
              className="display text-base"
              style={{ color: net <= 0 ? "var(--green)" : "var(--danger)" }}
            >
              {net > 0 ? "+" : ""}
              {Math.round(net)} kcal
            </span>
          </div>
        </div>
      ) : (
        moods.length === 0 && (
          <p className="text-xs text-muted">
            Tap <span className="font-semibold text-accent">Add data</span> to log meals,
            steps, water and more for this day.
          </p>
        )
      )}

      {moods.length > 0 && <MoodTimeline entries={moods} />}
    </div>
  );
}

function MoodTimeline({ entries }: { entries: MoodEntry[] }) {
  const sorted = entries
    .slice()
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
  return (
    <div className="mt-4 rounded-xl bg-surface-3 p-4">
      <p className="field-label">Mood through the day</p>
      {/* sparkline of mood levels */}
      <div className="mb-3 flex h-16 items-end gap-1.5">
        {sorted.map((e) => {
          const meta = MOODS.find((m) => m.value === e.mood) ?? MOODS[1];
          const level = { great: 1, ok: 0.7, tired: 0.45, bad: 0.25 }[e.mood];
          return (
            <div
              key={e.id}
              className="flex-1 rounded-md"
              style={{
                height: `${level * 100}%`,
                minHeight: 8,
                background: meta.color,
              }}
              title={meta.label}
            />
          );
        })}
      </div>
      <div className="space-y-1.5">
        {sorted.map((e) => {
          const meta = MOODS.find((m) => m.value === e.mood) ?? MOODS[1];
          const time = e.created_at
            ? new Date(e.created_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })
            : "";
          return (
            <div key={e.id} className="flex items-center gap-2.5">
              <span style={{ color: meta.color }}>
                <meta.Icon size={18} />
              </span>
              <span className="text-xs font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-[11px] text-muted">{time}</span>
              {e.note && (
                <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                  · {e.note}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({
  Icon,
  color,
  label,
  value,
  sub,
}: {
  Icon: (p: React.SVGProps<SVGSVGElement> & { size?: number }) => React.JSX.Element;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="chip h-9 w-9 rounded-xl" style={{ background: `${color}1f`, color }}>
        <Icon size={18} />
      </span>
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-right">
        <span className="display text-sm">{value}</span>
        {sub && <span className="block text-[10px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}
