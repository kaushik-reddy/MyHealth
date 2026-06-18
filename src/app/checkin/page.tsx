"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Collapsible from "@/components/Collapsible";
import { NumberField, Segmented, Stepper, TextField } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import { stepsToKm, walkingCalories, todayKey } from "@/lib/health";
import { DEFAULT_FOODS } from "@/lib/foods";
import type { FoodEntry, FoodLibraryItem, FoodSource, MoodEntry } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  EditIcon,
  CheckIcon,
  SugarIcon,
  PlusIcon,
  MOODS,
} from "@/components/icons";

const SOURCE_META: Record<FoodSource, { label: string; tint: string }> = {
  home: { label: "Home", tint: "var(--green)" },
  swiggy: { label: "Swiggy", tint: "#fc8019" },
  zomato: { label: "Zomato", tint: "#e23744" },
  dinein: { label: "Dine-in", tint: "var(--accent-2)" },
  other: { label: "Other", tint: "var(--muted)" },
};

export default function CheckinPage() {
  return (
    <AppShell title="Check-in" subtitle="Log a day's stats">
      <Suspense fallback={null}>
        <Checkin />
      </Suspense>
    </AppShell>
  );
}

function Checkin() {
  const {
    profile,
    dayLog,
    updateTodayLog,
    addWeight,
    selectedDate,
    setSelectedDate,
    foodsToday,
    moods,
    addMood,
    deleteMood,
  } = useStore();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(false);

  // Sync the store's selected day with the ?date= query param. Defaults to
  // today, and resets back to today when leaving the page.
  useEffect(() => {
    const d = searchParams.get("date") || todayKey();
    setSelectedDate(d);
    return () => {
      setSelectedDate(todayKey());
    };
  }, [searchParams, setSelectedDate]);

  if (!profile) return null;

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1100);
  };

  async function setSteps(steps: number) {
    const km = Math.round(stepsToKm(steps, profile!.height_cm) * 100) / 100;
    const cals = walkingCalories(km, profile!.current_weight_kg);
    await updateTodayLog({
      steps,
      distance_km: km,
      active_calories: Math.max(dayLog.active_calories, cals),
    });
    flash();
  }

  return (
    <div className="space-y-5">
      {/* smooth floating toast */}
      <div
        className={`pointer-events-none fixed left-1/2 top-16 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-green/40 bg-green/15 px-4 py-1.5 text-xs font-semibold text-green backdrop-blur transition-all duration-300 ${
          saved ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <CheckIcon size={14} /> Saved
      </div>

      <DayNav date={selectedDate} onChange={setSelectedDate} />

      <Section
        title="Movement"
        tint="var(--accent-2)"
        delay={0}
        summary={
          dayLog.steps || dayLog.active_calories
            ? `${dayLog.steps.toLocaleString()} steps · ${dayLog.distance_km.toFixed(1)} km · ${Math.round(dayLog.active_calories)} kcal`
            : "No movement logged yet — tap to add"
        }
      >
        <Stepper label="Steps" value={dayLog.steps} onChange={setSteps} step={500} max={60000} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Distance"
            value={dayLog.distance_km}
            onChange={(v) => updateTodayLog({ distance_km: v }).then(flash)}
            unit="km"
          />
          <NumberField
            label="Calories burned"
            value={dayLog.active_calories}
            onChange={(v) => updateTodayLog({ active_calories: v }).then(flash)}
            unit="kcal"
          />
        </div>
        <p className="text-[11px] text-muted">
          ≈ {stepsToKm(dayLog.steps, profile.height_cm).toFixed(2)} km ·{" "}
          {walkingCalories(stepsToKm(dayLog.steps, profile.height_cm), profile.current_weight_kg)} kcal from walking
        </p>
      </Section>

      <Section
        title="Hydration"
        tint="var(--purple)"
        delay={60}
        summary={
          dayLog.water_ml
            ? `${dayLog.water_ml} ml of ${profile.daily_water_goal_ml} ml`
            : "No water logged yet — tap to add"
        }
      >
        <div className="flex items-center justify-between">
          <span className="display text-3xl font-light">
            {dayLog.water_ml}
            <span className="ml-1 text-sm text-muted">ml</span>
          </span>
          <div className="flex gap-2">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => updateTodayLog({ water_ml: dayLog.water_ml + ml }).then(flash)}
                className="rounded-xl bg-surface-3 px-4 py-2.5 text-sm font-bold transition active:scale-95"
              >
                +{ml}
              </button>
            ))}
            <button
              onClick={() => updateTodayLog({ water_ml: 0 }).then(flash)}
              className="rounded-xl bg-surface-3 px-3 py-2.5 text-sm font-bold text-muted transition active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      <FoodSection onSaved={flash} />

      <SugarSection
        sugarG={dayLog.sugar_g}
        limit={profile.daily_sugar_limit_g}
        sugarFoods={foodsToday.filter((f) => (f.sugar_g || 0) > 0)}
      />

      <SpendSection />

      <Section
        title="Weigh-in & mood"
        tint="var(--accent-3)"
        delay={180}
        summary={
          dayLog.weight_kg || moodsForDay(moods, selectedDate).length
            ? `${dayLog.weight_kg ? `${dayLog.weight_kg} kg` : "no weigh-in"} · ${moodsForDay(moods, selectedDate).length} mood${moodsForDay(moods, selectedDate).length === 1 ? "" : "s"}`
            : "No weigh-in or mood yet — tap to add"
        }
      >
        <WeightInput
          current={dayLog.weight_kg ?? profile.current_weight_kg}
          onSave={(kg) => addWeight(kg).then(flash)}
        />
        <MoodLogger
          entries={moodsForDay(moods, selectedDate)}
          onAdd={(m, note) => addMood(m, note).then(flash)}
          onDelete={(id) => deleteMood(id).then(flash)}
        />
      </Section>
    </div>
  );
}

function moodsForDay(moods: MoodEntry[], date: string) {
  return moods
    .filter((m) => m.log_date === date)
    .sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
}

function DayNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (d: string) => void;
}) {
  const today = todayKey();
  const isToday = date >= today;
  const d = new Date(date + "T00:00:00");

  const shift = (days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    const key = nd.toISOString().slice(0, 10);
    // never allow navigating into the future
    if (key > today) return;
    onChange(key);
  };

  const label = isToday
    ? "Today"
    : d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-2.5">
      <button
        onClick={() => shift(-1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-muted transition active:scale-90"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <p className="text-base font-bold">{label}</p>
        <p className="text-[11px] text-muted">
          {d.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <button
        onClick={() => shift(1)}
        disabled={isToday}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-muted transition active:scale-90 disabled:opacity-25"
        aria-label="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function Section({
  title,
  tint,
  delay = 0,
  summary,
  defaultOpen,
  children,
}: {
  title: string;
  tint: string;
  delay?: number;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      title={title}
      tint={tint}
      delay={delay}
      summary={summary}
      defaultOpen={defaultOpen}
    >
      {children}
    </Collapsible>
  );
}

function WeightInput({ current, onSave }: { current: number; onSave: (kg: number) => void }) {
  const [kg, setKg] = useState(current);
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex-1">
        <NumberField label="Weight" value={kg} onChange={setKg} unit="kg" />
      </div>
      <button
        onClick={() => onSave(kg)}
        className="rounded-xl bg-accent px-5 py-3 text-sm font-bold uppercase text-white transition active:scale-95"
      >
        Log
      </button>
    </div>
  );
}

/* ---------- Mood logger: unlimited entries per day ---------- */
function MoodLogger({
  entries,
  onAdd,
  onDelete,
}: {
  entries: MoodEntry[];
  onAdd: (mood: MoodEntry["mood"], note: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [mood, setMood] = useState<MoodEntry["mood"]>("ok");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-3">
      <span className="field-label">How are you feeling?</span>
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map((m) => {
          const active = mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition active:scale-95"
              style={{
                background: active ? `${m.color}22` : "var(--surface-3)",
                color: active ? m.color : "var(--muted)",
              }}
            >
              <m.Icon size={26} />
              <span className="text-[10px] font-semibold">{m.label}</span>
            </button>
          );
        })}
      </div>
      <div className="field flex items-center px-3.5">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full bg-transparent py-3 text-sm outline-none"
        />
      </div>
      <button
        onClick={() => {
          onAdd(mood, note.trim() || null);
          setNote("");
        }}
        className="w-full rounded-xl bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
      >
        Add mood
      </button>

      {entries.length > 0 && (
        <div className="space-y-2 pt-1">
          {entries.map((e) => {
            const meta = MOODS.find((m) => m.value === e.mood) ?? MOODS[1];
            const time = e.created_at
              ? new Date(e.created_at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "";
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-surface-3 px-3 py-2.5"
              >
                <span style={{ color: meta.color }}>
                  <meta.Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                    <span className="ml-2 text-[11px] font-normal text-muted">
                      {time}
                    </span>
                  </p>
                  {e.note && (
                    <p className="truncate text-xs text-muted">{e.note}</p>
                  )}
                </div>
                <button
                  onClick={() => e.id && onDelete(e.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition active:scale-90"
                  aria-label="Delete mood"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Sugar: synced view of the day's sugar from food ---------- */
function SugarSection({
  sugarG,
  limit,
  sugarFoods,
}: {
  sugarG: number;
  limit: number;
  sugarFoods: FoodEntry[];
}) {
  const pct = limit > 0 ? Math.min(sugarG / limit, 1.4) : 0;
  const over = sugarG > limit;
  return (
    <Section
      title="Sugar"
      tint="var(--pink)"
      delay={140}
      summary={`${Math.round(sugarG * 10) / 10}g of ${limit}g${over ? " · over limit" : ""}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted">
          <SugarIcon size={18} /> Today&apos;s sugar
        </span>
        <span
          className="display text-2xl font-light"
          style={{ color: over ? "var(--danger)" : "var(--pink)" }}
        >
          {Math.round(sugarG * 10) / 10}
          <span className="text-sm text-muted">/{limit}g</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct * 100, 100)}%`,
            background: over ? "var(--danger)" : "var(--pink)",
          }}
        />
      </div>
      <p className="text-[11px] text-muted">
        {over
          ? `Over by ${Math.round((sugarG - limit) * 10) / 10}g. Sugar is pulled automatically from your food diary.`
          : `${Math.round((limit - sugarG) * 10) / 10}g left. Anything sugary you log appears here automatically.`}
      </p>
      {sugarFoods.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="field-label">From your food today</p>
          {sugarFoods.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl bg-surface-3 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="display shrink-0 text-sm" style={{ color: "var(--pink)" }}>
                {f.sugar_g}g
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- Food: remembered library + quantity picker ---------- */

function FoodSection({ onSaved }: { onSaved: () => void }) {
  const {
    foodsToday,
    foodLibrary,
    logLibraryFood,
    deleteFood,
    rememberFood,
    deleteLibraryFood,
  } = useStore();
  const [meal, setMeal] = useState<FoodEntry["meal_type"]>(currentMeal());
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  // Suggestions = personal library first, then defaults not already saved.
  const suggestions = useMemo<FoodLibraryItem[]>(() => {
    const savedNames = new Set(foodLibrary.map((f) => f.name.toLowerCase()));
    const defaults: FoodLibraryItem[] = DEFAULT_FOODS.filter(
      (d) => !savedNames.has(d.name.toLowerCase())
    ).map((d) => ({ ...d, times_used: 0 }));
    const all = [...foodLibrary, ...defaults];
    const q = query.trim().toLowerCase();
    return all
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .slice(0, q ? 30 : 8);
  }, [foodLibrary, query]);

  const totals = foodsToday.reduce(
    (a, f) => ({
      cal: a.cal + f.calories,
      sugar: a.sugar + f.sugar_g,
      protein: a.protein + f.protein_g,
    }),
    { cal: 0, sugar: 0, protein: 0 }
  );

  return (
    <Section
      title="Food diary"
      tint="var(--accent)"
      delay={120}
      summary={
        foodsToday.length
          ? `${foodsToday.length} item${foodsToday.length > 1 ? "s" : ""} · ${Math.round(totals.cal)} kcal · ${Math.round(totals.sugar * 10) / 10}g sugar`
          : "No meals logged yet — tap to add"
      }
    >
      {/* meal selector applies to whatever you add */}
      <div>
        <span className="field-label">Adding to</span>
        <Segmented
          value={meal}
          onChange={setMeal}
          options={[
            { value: "breakfast", label: "AM" },
            { value: "lunch", label: "Lunch" },
            { value: "dinner", label: "Dinner" },
            { value: "snack", label: "Snack" },
          ]}
        />
      </div>

      {/* today's entries */}
      <div className="space-y-2">
        {foodsToday.length === 0 && (
          <p className="text-xs text-muted">No meals logged yet today.</p>
        )}
        {foodsToday.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-2xl bg-surface-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {f.name}
                {f.quantity && f.quantity !== 1 ? (
                  <span className="text-muted"> ×{f.quantity}</span>
                ) : null}
                {f.source && f.source !== "home" && (
                  <span
                    className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      background: `${SOURCE_META[f.source].tint}22`,
                      color: SOURCE_META[f.source].tint,
                    }}
                  >
                    {SOURCE_META[f.source].label}
                    {f.cost ? ` ₹${Math.round(f.cost)}` : ""}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted capitalize">
                {f.meal_type} · {Math.round(f.calories)} kcal · {f.sugar_g}g sugar · {f.protein_g}g protein
              </p>
            </div>
            <button
              onClick={() => f.id && deleteFood(f.id).then(onSaved)}
              className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition active:scale-90"
              aria-label="Delete"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
      </div>

      {foodsToday.length > 0 && (
        <p className="px-1 text-[11px] text-muted">
          Total: {Math.round(totals.cal)} kcal · {Math.round(totals.sugar * 10) / 10}g sugar ·{" "}
          {Math.round(totals.protein)}g protein
        </p>
      )}

      {/* search remembered foods */}
      <TextField
        label="Search foods"
        value={query}
        onChange={setQuery}
        placeholder="e.g. Banana, Roti, Coffee…"
      />

      <div className="space-y-2">
        {suggestions.map((item) => (
          <PickRow
            key={item.id ?? item.name}
            item={item}
            onLog={(qty, opts) => logLibraryFood(item, qty, meal, opts).then(onSaved)}
            onSaveEdit={(edited) => rememberFood(edited).then(() => onSaved())}
            onForget={
              item.id ? () => deleteLibraryFood(item.id!).then(onSaved) : undefined
            }
          />
        ))}
      </div>

      {/* create a brand-new food */}
      {creating ? (
        <NewFoodForm
          onCancel={() => setCreating(false)}
          onCreate={async (item, qty) => {
            const saved = await rememberFood(item);
            await logLibraryFood(saved, qty, meal);
            setCreating(false);
            setQuery("");
            onSaved();
          }}
        />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-xs font-bold uppercase tracking-wide text-muted transition active:scale-[0.98]"
        >
          <PlusIcon size={16} /> New food
        </button>
      )}
    </Section>
  );
}

function PickRow({
  item,
  onLog,
  onSaveEdit,
  onForget,
}: {
  item: FoodLibraryItem;
  onLog: (qty: number, opts?: { source?: FoodSource; cost?: number }) => void;
  onSaveEdit: (edited: FoodLibraryItem) => void;
  onForget?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(1);
  const [out, setOut] = useState<boolean>(
    !!item.default_source && item.default_source !== "home"
  );
  const [source, setSource] = useState<FoodSource>(item.default_source ?? "swiggy");
  const [cost, setCost] = useState<number>(item.default_cost ?? 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.name}
            {item.times_used > 0 && (
              <span className="ml-2 text-[10px] font-bold uppercase text-accent-3">
                {item.times_used >= 3 ? "favourite" : "saved"}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {item.serving_label} · {item.calories} kcal · {item.sugar_g}g sugar · {item.protein_g}g protein
          </p>
        </div>
        <span
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent transition"
          style={{ transform: open ? "rotate(45deg)" : "none" }}
        >
          <PlusIcon size={18} />
        </span>
      </button>

      {open && !editing && (
        <div className="space-y-3 px-4 pb-4">
          <QuantityStepper value={qty} onChange={setQty} />

          {/* eat-out toggle */}
          <button
            onClick={() => setOut((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-left"
          >
            <span className="text-xs font-semibold text-muted">
              Ate out / ordered?
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${
                out ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  out ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          {out && (
            <div className="space-y-2.5">
              <Segmented
                value={source}
                onChange={setSource}
                options={[
                  { value: "swiggy", label: "Swiggy" },
                  { value: "zomato", label: "Zomato" },
                  { value: "dinein", label: "Dine-in" },
                  { value: "other", label: "Other" },
                ]}
              />
              <NumberField label="Amount spent" value={cost} onChange={setCost} unit="₹" />
            </div>
          )}

          <p className="text-[11px] text-muted">
            = {Math.round(item.calories * qty)} kcal ·{" "}
            {Math.round(item.sugar_g * qty * 10) / 10}g sugar ·{" "}
            {Math.round(item.protein_g * qty * 10) / 10}g protein
            {out && cost > 0 ? ` · ₹${Math.round(cost)}` : ""}
          </p>
          <button
            onClick={() => {
              onLog(qty, out ? { source, cost } : { source: "home", cost: 0 });
              setOpen(false);
              setQty(1);
            }}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
          >
            Add to diary
          </button>

          <div className="flex items-center justify-between pt-0.5">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent-2"
            >
              <EditIcon size={14} /> Edit details
            </button>
            {onForget && (
              <button
                onClick={onForget}
                className="text-xs font-semibold text-muted"
              >
                Forget
              </button>
            )}
          </div>
        </div>
      )}

      {open && editing && (
        <EditFoodForm
          item={item}
          onCancel={() => setEditing(false)}
          onSave={(edited) => {
            onSaveEdit(edited);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function EditFoodForm({
  item,
  onCancel,
  onSave,
}: {
  item: FoodLibraryItem;
  onCancel: () => void;
  onSave: (edited: FoodLibraryItem) => void;
}) {
  const [serving, setServing] = useState(item.serving_label);
  const [cal, setCal] = useState(item.calories);
  const [sugar, setSugar] = useState(item.sugar_g);
  const [protein, setProtein] = useState(item.protein_g);
  const [category, setCategory] = useState(item.category ?? "");

  return (
    <div className="space-y-3 px-4 pb-4">
      <p className="text-xs font-semibold text-muted">
        Edit “{item.name}” (per {serving || "serving"})
      </p>
      <TextField label="Serving" value={serving} onChange={setServing} placeholder="1 plate / 100 g" />
      <div className="grid grid-cols-3 gap-2.5">
        <NumberField label="kcal" value={cal} onChange={setCal} />
        <NumberField label="sugar g" value={sugar} onChange={setSugar} />
        <NumberField label="protein g" value={protein} onChange={setProtein} />
      </div>
      <TextField label="Category" value={category} onChange={setCategory} placeholder="South Indian" />
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl bg-surface-2 py-3 text-xs font-bold uppercase tracking-wide text-muted"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              ...item,
              serving_label: serving.trim() || "1 serving",
              calories: cal,
              sugar_g: sugar,
              protein_g: protein,
              category: category.trim() || null,
            })
          }
          className="flex-1 rounded-xl bg-accent py-3 text-xs font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
        >
          Save details
        </button>
      </div>
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(0.25, Math.round(v * 100) / 100);
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5">
      <span className="text-xs font-semibold text-muted">Servings</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(clamp(value - 0.5))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-lg font-bold text-muted active:scale-90"
        >
          −
        </button>
        <span className="display w-10 text-center text-lg font-light">{value}</span>
        <button
          onClick={() => onChange(clamp(value + 0.5))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-lg font-bold text-white active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

function NewFoodForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (item: FoodLibraryItem, qty: number) => void;
}) {
  const [name, setName] = useState("");
  const [serving, setServing] = useState("1 serving");
  const [cal, setCal] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [protein, setProtein] = useState(0);

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
      <TextField label="Food name" value={name} onChange={setName} placeholder="e.g. Veg sandwich" />
      <TextField label="Serving" value={serving} onChange={setServing} placeholder="1 plate / 100 g" />
      <div className="grid grid-cols-3 gap-2.5">
        <NumberField label="kcal" value={cal} onChange={setCal} />
        <NumberField label="sugar g" value={sugar} onChange={setSugar} />
        <NumberField label="protein g" value={protein} onChange={setProtein} />
      </div>
      <p className="text-[10px] text-muted">
        Saved to your foods so you can quickly add it next time.
      </p>
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl bg-surface-3 py-3 text-xs font-bold uppercase tracking-wide text-muted"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!name.trim()) return;
            onCreate(
              {
                name: name.trim(),
                serving_label: serving.trim() || "1 serving",
                calories: cal,
                sugar_g: sugar,
                protein_g: protein,
                category: null,
                times_used: 0,
              },
              1
            );
          }}
          className="flex-1 rounded-xl bg-accent py-3 text-xs font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
        >
          Save & add
        </button>
      </div>
    </div>
  );
}

function currentMeal(): FoodEntry["meal_type"] {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

/* ---------- Eating-out spend tracker ---------- */

function SpendSection() {
  const { recentFoods } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = weekAgo.toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  const monthKey = monthAgo.toISOString().slice(0, 10);

  const outside = recentFoods.filter(
    (f) => f.cost && f.cost > 0 && f.source && f.source !== "home"
  );

  const sum = (arr: FoodEntry[]) => arr.reduce((s, f) => s + (f.cost || 0), 0);
  const todaySpend = sum(outside.filter((f) => f.log_date === today));
  const weekSpend = sum(outside.filter((f) => f.log_date >= weekKey));
  const monthSpend = sum(outside.filter((f) => f.log_date >= monthKey));

  // breakdown by platform for the last 30 days
  const byPlatform = (["swiggy", "zomato", "dinein", "other"] as FoodSource[]).map(
    (src) => ({
      src,
      amount: sum(outside.filter((f) => f.log_date >= monthKey && f.source === src)),
    })
  );
  const maxPlatform = Math.max(1, ...byPlatform.map((p) => p.amount));

  const recent = outside
    .slice()
    .sort((a, b) =>
      (b.created_at ?? b.log_date).localeCompare(a.created_at ?? a.log_date)
    )
    .slice(0, 6);

  return (
    <Section
      title="Eating-out spend"
      tint="#fc8019"
      delay={150}
      summary={
        todaySpend
          ? `₹${Math.round(todaySpend)} today · ₹${Math.round(weekSpend)} this week`
          : weekSpend
            ? `₹${Math.round(weekSpend)} this week`
            : "No outside food logged — tap to view"
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <SpendStat label="Today" value={todaySpend} tint="var(--accent)" />
        <SpendStat label="7 days" value={weekSpend} tint="var(--accent-2)" />
        <SpendStat label="30 days" value={monthSpend} tint="var(--accent-3)" />
      </div>

      {monthSpend > 0 ? (
        <>
          <div className="space-y-2 pt-1">
            {byPlatform
              .filter((p) => p.amount > 0)
              .map((p) => (
                <div key={p.src} className="flex items-center gap-3">
                  <span
                    className="w-16 shrink-0 text-[11px] font-semibold uppercase"
                    style={{ color: SOURCE_META[p.src].tint }}
                  >
                    {SOURCE_META[p.src].label}
                  </span>
                  <div className="tower-bar flex-1">
                    <div
                      className="tower-fill"
                      style={{
                        width: `${(p.amount / maxPlatform) * 100}%`,
                        background: SOURCE_META[p.src].tint,
                      }}
                    />
                  </div>
                  <span className="mono w-16 shrink-0 text-right text-xs font-bold">
                    ₹{Math.round(p.amount)}
                  </span>
                </div>
              ))}
          </div>

          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Recent orders
            </p>
            {recent.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between border-b border-border/50 py-1.5 text-xs last:border-0"
              >
                <span className="min-w-0 truncate">
                  <span
                    className="mr-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      background: `${SOURCE_META[f.source!].tint}22`,
                      color: SOURCE_META[f.source!].tint,
                    }}
                  >
                    {SOURCE_META[f.source!].label}
                  </span>
                  {f.name}
                </span>
                <span className="mono shrink-0 font-bold">₹{Math.round(f.cost!)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">
          When you add a food and toggle “Ate out / ordered?”, the bill amount shows up
          here — split by Swiggy, Zomato and dine-in.
        </p>
      )}
    </Section>
  );
}

function SpendStat({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mono text-lg font-black" style={{ color: tint }}>
        ₹{Math.round(value)}
      </p>
    </div>
  );
}
