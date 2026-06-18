"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { NumberField, Segmented, Stepper, TextField } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import { stepsToKm, walkingCalories } from "@/lib/health";
import { DEFAULT_FOODS } from "@/lib/foods";
import type { FoodEntry, FoodLibraryItem } from "@/lib/types";

export default function CheckinPage() {
  return (
    <AppShell title="Check-in" subtitle="Log today's telemetry">
      <Checkin />
    </AppShell>
  );
}

function Checkin() {
  const { profile, todayLog, updateTodayLog, addWeight } = useStore();
  const [saved, setSaved] = useState(false);

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
      active_calories: Math.max(todayLog.active_calories, cals),
    });
    flash();
  }

  return (
    <div className="space-y-4">
      {/* smooth floating toast */}
      <div
        className={`pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-green/40 bg-green/15 px-4 py-1.5 text-xs font-semibold text-green backdrop-blur transition-all duration-300 ${
          saved ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        Saved ✓
      </div>

      <Section title="Movement" tint="var(--accent-2)" delay={0}>
        <Stepper label="Steps" value={todayLog.steps} onChange={setSteps} step={500} max={60000} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Distance"
            value={todayLog.distance_km}
            onChange={(v) => updateTodayLog({ distance_km: v }).then(flash)}
            unit="km"
          />
          <NumberField
            label="Calories burned"
            value={todayLog.active_calories}
            onChange={(v) => updateTodayLog({ active_calories: v }).then(flash)}
            unit="kcal"
          />
        </div>
        <p className="text-[11px] text-muted">
          ≈ {stepsToKm(todayLog.steps, profile.height_cm).toFixed(2)} km ·{" "}
          {walkingCalories(stepsToKm(todayLog.steps, profile.height_cm), profile.current_weight_kg)} kcal from walking
        </p>
      </Section>

      <Section title="Hydration" tint="var(--purple)" delay={60}>
        <div className="flex items-center justify-between">
          <span className="mono text-2xl font-bold">{todayLog.water_ml} ml</span>
          <div className="flex gap-2">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => updateTodayLog({ water_ml: todayLog.water_ml + ml }).then(flash)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-bold transition active:scale-95"
              >
                +{ml}
              </button>
            ))}
            <button
              onClick={() => updateTodayLog({ water_ml: 0 }).then(flash)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-muted transition active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      <FoodSection onSaved={flash} />

      <Section title="Weigh-in & mood" tint="var(--accent-3)" delay={180}>
        <WeightInput
          current={todayLog.weight_kg ?? profile.current_weight_kg}
          onSave={(kg) => addWeight(kg).then(flash)}
        />
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Mood
          </span>
          <Segmented
            value={todayLog.mood ?? "ok"}
            onChange={(m) => updateTodayLog({ mood: m }).then(flash)}
            options={[
              { value: "great", label: "🌟" },
              { value: "ok", label: "🙂" },
              { value: "tired", label: "😴" },
              { value: "bad", label: "😩" },
            ]}
          />
        </div>
        <TextField
          label="Notes"
          value={todayLog.notes ?? ""}
          onChange={(v) => updateTodayLog({ notes: v })}
          placeholder="How did today go?"
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  tint,
  delay = 0,
  children,
}: {
  title: string;
  tint: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card rise-in p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full" style={{ background: tint }} />
        <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function WeightInput({ current, onSave }: { current: number; onSave: (kg: number) => void }) {
  const [kg, setKg] = useState(current);
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <NumberField label="Today's weight" value={kg} onChange={setKg} unit="kg" />
      </div>
      <button
        onClick={() => onSave(kg)}
        className="rounded-lg bg-accent px-4 py-2.5 text-xs font-bold uppercase text-[#0e1512] transition active:scale-95"
      >
        Log
      </button>
    </div>
  );
}

/* ---------- Food: remembered library + quantity picker ---------- */

function FoodSection({ onSaved }: { onSaved: () => void }) {
  const { foodsToday, foodLibrary, logLibraryFood, deleteFood, rememberFood } = useStore();
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
    <Section title="Food diary" tint="var(--accent)" delay={120}>
      {/* meal selector applies to whatever you add */}
      <div>
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          Adding to
        </span>
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
            className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {f.name}
                {f.quantity && f.quantity !== 1 ? (
                  <span className="text-muted"> ×{f.quantity}</span>
                ) : null}
              </p>
              <p className="text-[11px] text-muted capitalize">
                {f.meal_type} · {Math.round(f.calories)} kcal · {f.sugar_g}g sugar · {f.protein_g}g protein
              </p>
            </div>
            <button
              onClick={() => f.id && deleteFood(f.id).then(onSaved)}
              className="ml-2 shrink-0 text-muted transition active:scale-90"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {foodsToday.length > 0 && (
        <p className="text-[11px] text-muted">
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
            onLog={(qty) => logLibraryFood(item, qty, meal).then(onSaved)}
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
          className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs font-bold uppercase tracking-wide text-muted transition active:scale-[0.98]"
        >
          ＋ New food
        </button>
      )}
    </Section>
  );
}

function PickRow({ item, onLog }: { item: FoodLibraryItem; onLog: (qty: number) => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);

  return (
    <div className="rounded-lg border border-border bg-surface-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {item.name}
            {item.times_used > 0 && (
              <span className="ml-2 text-[10px] font-bold uppercase text-accent-3">
                {item.times_used >= 3 ? "favourite" : "saved"}
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted">
            {item.serving_label} · {item.calories} kcal · {item.sugar_g}g sugar · {item.protein_g}g protein
          </p>
        </div>
        <span className="ml-2 shrink-0 text-lg text-accent">{open ? "−" : "＋"}</span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border px-3 py-2.5">
          <QuantityStepper value={qty} onChange={setQty} />
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
            <span>
              = {Math.round(item.calories * qty)} kcal ·{" "}
              {Math.round(item.sugar_g * qty * 10) / 10}g sugar ·{" "}
              {Math.round(item.protein_g * qty * 10) / 10}g protein
            </span>
            <button
              onClick={() => {
                onLog(qty);
                setOpen(false);
                setQty(1);
              }}
              className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold uppercase text-[#0e1512] transition active:scale-95"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(0.25, Math.round(v * 100) / 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Servings
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => onChange(clamp(value - 0.5))}
          className="h-8 w-8 rounded-lg border border-border bg-surface-3 text-base font-bold active:scale-95"
        >
          −
        </button>
        <span className="mono w-12 text-center text-base font-bold">{value}</span>
        <button
          onClick={() => onChange(clamp(value + 0.5))}
          className="h-8 w-8 rounded-lg border border-border bg-surface-3 text-base font-bold active:scale-95"
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
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <TextField label="Food name" value={name} onChange={setName} placeholder="e.g. Veg sandwich" />
      <TextField label="Serving" value={serving} onChange={setServing} placeholder="1 plate / 100 g" />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="kcal" value={cal} onChange={setCal} />
        <NumberField label="sugar g" value={sugar} onChange={setSugar} />
        <NumberField label="protein g" value={protein} onChange={setProtein} />
      </div>
      <p className="text-[10px] text-muted">
        Saved to your foods so you can quickly add it next time.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2.5 text-xs font-bold uppercase tracking-wide text-muted"
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
          className="flex-1 rounded-lg bg-accent py-2.5 text-xs font-bold uppercase tracking-wide text-[#0e1512] transition active:scale-[0.98]"
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
