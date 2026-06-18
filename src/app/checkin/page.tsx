"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { NumberField, Segmented, Stepper, TextField } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import { stepsToKm, walkingCalories } from "@/lib/health";
import { DEFAULT_FOODS } from "@/lib/foods";
import type { FoodEntry, FoodLibraryItem, FoodSource } from "@/lib/types";

const SOURCE_META: Record<FoodSource, { label: string; tint: string }> = {
  home: { label: "Home", tint: "var(--green)" },
  swiggy: { label: "Swiggy", tint: "#fc8019" },
  zomato: { label: "Zomato", tint: "#e23744" },
  dinein: { label: "Dine-in", tint: "var(--accent-2)" },
  other: { label: "Other", tint: "var(--muted)" },
};

export default function CheckinPage() {
  return (
    <AppShell title="Check-in" subtitle="Log today's stats">
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

      <SpendSection />

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
        className="rounded-lg bg-accent px-4 py-2.5 text-xs font-bold uppercase text-white transition active:scale-95"
      >
        Log
      </button>
    </div>
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
          className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs font-bold uppercase tracking-wide text-muted transition active:scale-[0.98]"
        >
          ＋ New food
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
            {item.category && (
              <span className="ml-2 text-[10px] uppercase text-muted">{item.category}</span>
            )}
          </p>
          <p className="text-[11px] text-muted">
            {item.serving_label} · {item.calories} kcal · {item.sugar_g}g sugar · {item.protein_g}g protein
          </p>
        </div>
        <span className="ml-2 shrink-0 text-lg text-accent">{open ? "−" : "＋"}</span>
      </button>

      {open && !editing && (
        <div className="space-y-2.5 border-t border-border px-3 py-2.5">
          <QuantityStepper value={qty} onChange={setQty} />

          {/* eat-out toggle */}
          <button
            onClick={() => setOut((o) => !o)}
            className="flex w-full items-center justify-between rounded-md bg-surface-3 px-3 py-2 text-left"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
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
            <div className="space-y-2">
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

          <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
            <span>
              = {Math.round(item.calories * qty)} kcal ·{" "}
              {Math.round(item.sugar_g * qty * 10) / 10}g sugar ·{" "}
              {Math.round(item.protein_g * qty * 10) / 10}g protein
              {out && cost > 0 ? ` · ₹${Math.round(cost)}` : ""}
            </span>
            <button
              onClick={() => {
                onLog(qty, out ? { source, cost } : { source: "home", cost: 0 });
                setOpen(false);
                setQty(1);
              }}
              className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold uppercase text-white transition active:scale-95"
            >
              Add
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] font-semibold uppercase tracking-wide text-accent-2"
            >
              ✎ Edit details
            </button>
            {onForget && (
              <button
                onClick={onForget}
                className="text-[11px] font-semibold uppercase tracking-wide text-muted"
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
    <div className="space-y-2 border-t border-border px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Edit “{item.name}” (per {serving || "serving"})
      </p>
      <TextField label="Serving" value={serving} onChange={setServing} placeholder="1 plate / 100 g" />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="kcal" value={cal} onChange={setCal} />
        <NumberField label="sugar g" value={sugar} onChange={setSugar} />
        <NumberField label="protein g" value={protein} onChange={setProtein} />
      </div>
      <TextField label="Category" value={category} onChange={setCategory} placeholder="South Indian" />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2 text-[11px] font-bold uppercase tracking-wide text-muted"
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
          className="flex-1 rounded-lg bg-accent py-2 text-[11px] font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
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
          className="flex-1 rounded-lg bg-accent py-2.5 text-xs font-bold uppercase tracking-wide text-white transition active:scale-[0.98]"
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
    <Section title="Eating-out spend" tint="#fc8019" delay={150}>
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
