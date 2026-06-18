"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { NumberField, Segmented, Stepper } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import {
  ACTIVITY_LABELS,
  bmi,
  bmiCategory,
  bmr,
  calorieTarget,
  tdee,
} from "@/lib/health";
import type { ActivityLevel, GoalType, Profile } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AppShell title="Garage" subtitle="Tune your setup">
      <Garage />
    </AppShell>
  );
}

function Garage() {
  const { profile, saveProfile, signOut, demoMode, user } = useStore();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(profile);
  const [saved, setSaved] = useState(false);

  if (!p) return null;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP({ ...p, [key]: value });

  const goalType: GoalType =
    p.goal_weight_kg < p.current_weight_kg
      ? "lose"
      : p.goal_weight_kg > p.current_weight_kg
        ? "gain"
        : "maintain";
  const maintenance = tdee(p.sex, p.current_weight_kg, p.height_cm, p.age, p.activity_level);
  const recommended = calorieTarget(maintenance, goalType, p.weekly_rate_kg);
  const bmiVal = bmi(p.current_weight_kg, p.height_cm);
  const bmiCat = bmiCategory(bmiVal);

  async function save() {
    await saveProfile({ ...p!, goal_type: goalType });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      {saved && (
        <div className="rounded-lg border border-green/40 bg-green/10 px-3 py-2 text-center text-xs font-semibold text-green">
          Setup saved ✓
        </div>
      )}

      {/* identity */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{p.full_name || "Driver"}</p>
            <p className="text-xs text-muted">
              {demoMode ? "Demo mode · this device" : user?.email}
            </p>
          </div>
          <div className="text-right">
            <p className="mono text-xl font-black" style={{ color: bmiCat.color }}>
              {bmiVal.toFixed(1)}
            </p>
            <p className="text-[10px] uppercase text-muted">{bmiCat.label} BMI</p>
          </div>
        </div>
      </div>

      {/* body */}
      <Block title="Body">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Sex
          </span>
          <Segmented
            value={p.sex}
            onChange={(v) => set("sex", v)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Age" value={p.age} onChange={(v) => set("age", v)} unit="yrs" />
          <NumberField label="Height" value={p.height_cm} onChange={(v) => set("height_cm", v)} unit="cm" />
        </div>
        <Stepper
          label="Current weight"
          value={p.current_weight_kg}
          onChange={(v) => set("current_weight_kg", v)}
          step={0.5}
          min={30}
          max={300}
          unit="kg"
        />
        <Stepper
          label="Goal weight"
          value={p.goal_weight_kg}
          onChange={(v) => set("goal_weight_kg", v)}
          step={0.5}
          min={30}
          max={300}
          unit="kg"
        />
      </Block>

      {/* activity & pace */}
      <Block title="Activity & pace">
        <div className="space-y-2">
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
            <button
              key={a}
              onClick={() => set("activity_level", a)}
              className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${
                p.activity_level === a
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface-2"
              }`}
            >
              {ACTIVITY_LABELS[a]}
            </button>
          ))}
        </div>
        {goalType !== "maintain" && (
          <Stepper
            label={`Weekly ${goalType} rate`}
            value={p.weekly_rate_kg}
            onChange={(v) => set("weekly_rate_kg", v)}
            step={0.1}
            min={0.1}
            max={1}
            unit="kg/wk"
          />
        )}
        <div className="card flex items-center justify-between bg-surface-2 p-3">
          <span className="text-xs text-muted">Recommended target</span>
          <button
            onClick={() => set("daily_calorie_target", recommended)}
            className="mono text-sm font-bold text-accent-2"
          >
            {recommended} kcal · tap to use
          </button>
        </div>
        <p className="text-[11px] text-muted">
          BMR {Math.round(bmr(p.sex, p.current_weight_kg, p.height_cm, p.age))} kcal · Maintenance {maintenance} kcal
        </p>
      </Block>

      {/* daily targets */}
      <Block title="Daily targets">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Calories"
            value={p.daily_calorie_target}
            onChange={(v) => set("daily_calorie_target", v)}
            unit="kcal"
          />
          <NumberField
            label="Sugar limit"
            value={p.daily_sugar_limit_g}
            onChange={(v) => set("daily_sugar_limit_g", v)}
            unit="g"
          />
          <NumberField
            label="Steps"
            value={p.daily_step_goal}
            onChange={(v) => set("daily_step_goal", v)}
          />
          <NumberField
            label="Water"
            value={p.daily_water_goal_ml}
            onChange={(v) => set("daily_water_goal_ml", v)}
            unit="ml"
          />
          <NumberField
            label="Protein"
            value={p.daily_protein_goal_g}
            onChange={(v) => set("daily_protein_goal_g", v)}
            unit="g"
          />
        </div>
      </Block>

      <button
        onClick={save}
        className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold uppercase tracking-wide text-[#0e1512]"
      >
        Save setup
      </button>

      <button
        onClick={handleSignOut}
        className="w-full rounded-lg border border-border py-3 text-sm font-bold uppercase tracking-wide text-muted"
      >
        {demoMode ? "Reset demo / exit" : "Sign out"}
      </button>

      <p className="pb-2 text-center text-[10px] text-muted">
        MyHealth · Box Box theme · built for mobile
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
