"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { NumberField, Segmented, Stepper, TextField } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import { stepsToKm, walkingCalories } from "@/lib/health";
import type { FoodEntry } from "@/lib/types";

export default function CheckinPage() {
  return (
    <AppShell title="Check-in" subtitle="Log today's telemetry">
      <Checkin />
    </AppShell>
  );
}

function Checkin() {
  const { profile, todayLog, foodsToday, updateTodayLog, addFood, deleteFood, addWeight } =
    useStore();
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  async function setSteps(steps: number) {
    const km = Math.round(stepsToKm(steps, profile!.height_cm) * 100) / 100;
    const cals = walkingCalories(km, profile!.current_weight_kg);
    await updateTodayLog({ steps, distance_km: km, active_calories: Math.max(todayLog.active_calories, cals) });
    flash();
  }

  return (
    <div className="space-y-4">
      {saved && (
        <div className="rounded-lg border border-green/40 bg-green/10 px-3 py-2 text-center text-xs font-semibold text-green">
          Saved ✓
        </div>
      )}

      {/* Movement */}
      <Section title="Movement" tint="var(--accent-2)">
        <Stepper
          label="Steps"
          value={todayLog.steps}
          onChange={setSteps}
          step={500}
          max={60000}
        />
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

      {/* Hydration */}
      <Section title="Hydration" tint="var(--purple)">
        <div className="flex items-center justify-between">
          <span className="mono text-2xl font-bold">{todayLog.water_ml} ml</span>
          <div className="flex gap-2">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() =>
                  updateTodayLog({ water_ml: todayLog.water_ml + ml }).then(flash)
                }
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-bold"
              >
                +{ml}
              </button>
            ))}
            <button
              onClick={() => updateTodayLog({ water_ml: 0 }).then(flash)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-muted"
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      {/* Food log */}
      <FoodLog
        foods={foodsToday}
        onAdd={(f) => addFood(f).then(flash)}
        onDelete={(id) => deleteFood(id).then(flash)}
      />

      {/* Weight & mood */}
      <Section title="Weigh-in & mood" tint="var(--accent-3)">
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
              { value: "great", label: "🔥" },
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
  children,
}: {
  title: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full" style={{ background: tint }} />
        <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function WeightInput({
  current,
  onSave,
}: {
  current: number;
  onSave: (kg: number) => void;
}) {
  const [kg, setKg] = useState(current);
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <NumberField label="Today's weight" value={kg} onChange={setKg} unit="kg" />
      </div>
      <button
        onClick={() => onSave(kg)}
        className="rounded-lg bg-accent px-4 py-2.5 text-xs font-bold uppercase text-white"
      >
        Log
      </button>
    </div>
  );
}

function FoodLog({
  foods,
  onAdd,
  onDelete,
}: {
  foods: FoodEntry[];
  onAdd: (f: Omit<FoodEntry, "log_date">) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [cal, setCal] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [protein, setProtein] = useState(0);
  const [meal, setMeal] = useState<FoodEntry["meal_type"]>("breakfast");

  function add() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), calories: cal, sugar_g: sugar, protein_g: protein, meal_type: meal });
    setName("");
    setCal(0);
    setSugar(0);
    setProtein(0);
  }

  const totals = foods.reduce(
    (a, f) => ({
      cal: a.cal + f.calories,
      sugar: a.sugar + f.sugar_g,
      protein: a.protein + f.protein_g,
    }),
    { cal: 0, sugar: 0, protein: 0 }
  );

  return (
    <Section title="Food diary" tint="var(--accent)">
      <div className="space-y-2">
        {foods.length === 0 && (
          <p className="text-xs text-muted">No meals logged yet today.</p>
        )}
        {foods.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="text-[11px] text-muted capitalize">
                {f.meal_type} · {Math.round(f.calories)} kcal · {f.sugar_g}g sugar · {f.protein_g}g protein
              </p>
            </div>
            <button
              onClick={() => f.id && onDelete(f.id)}
              className="ml-2 shrink-0 text-muted"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {foods.length > 0 && (
        <p className="text-[11px] text-muted">
          Total: {Math.round(totals.cal)} kcal · {Math.round(totals.sugar * 10) / 10}g sugar ·{" "}
          {Math.round(totals.protein)}g protein
        </p>
      )}

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <TextField label="Add food" value={name} onChange={setName} placeholder="e.g. Banana" />
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
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="kcal" value={cal} onChange={setCal} />
          <NumberField label="sugar g" value={sugar} onChange={setSugar} />
          <NumberField label="protein g" value={protein} onChange={setProtein} />
        </div>
        <button
          onClick={add}
          className="w-full rounded-lg bg-accent py-2.5 text-xs font-bold uppercase tracking-wide text-white"
        >
          Add to diary
        </button>
      </div>
    </Section>
  );
}
