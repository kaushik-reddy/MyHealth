"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Segmented, Stepper } from "@/components/Inputs";
import {
  ACTIVITY_LABELS,
  bmi,
  bmiCategory,
  calorieTarget,
  tdee,
} from "@/lib/health";
import type {
  ActivityLevel,
  GoalType,
  Profile,
  Sex,
} from "@/lib/types";

const STEPS = ["You", "Body", "Goal", "Targets"] as const;

export default function OnboardingPage() {
  const { saveProfile, profile } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(profile?.full_name ?? "");
  const [sex, setSex] = useState<Sex>(profile?.sex ?? "male");
  const [age, setAge] = useState(profile?.age ?? 30);
  const [height, setHeight] = useState(profile?.height_cm ?? 175);
  const [weight, setWeight] = useState(profile?.current_weight_kg ?? 80);
  const [goalWeight, setGoalWeight] = useState(profile?.goal_weight_kg ?? 72);
  const [activity, setActivity] = useState<ActivityLevel>(
    profile?.activity_level ?? "light"
  );
  const [rate, setRate] = useState(profile?.weekly_rate_kg ?? 0.5);

  const goalType: GoalType =
    goalWeight < weight ? "lose" : goalWeight > weight ? "gain" : "maintain";
  const maintenance = tdee(sex, weight, height, age, activity);
  const target = calorieTarget(maintenance, goalType, rate);
  const bmiVal = bmi(weight, height);
  const bmiCat = bmiCategory(bmiVal);

  async function finish() {
    setBusy(true);
    const p: Profile = {
      id: profile?.id ?? "local",
      full_name: name || null,
      sex,
      age,
      height_cm: height,
      start_weight_kg: profile?.start_weight_kg ?? weight,
      current_weight_kg: weight,
      goal_weight_kg: goalWeight,
      goal_type: goalType,
      activity_level: activity,
      weekly_rate_kg: rate,
      daily_calorie_target: target,
      daily_sugar_limit_g: 30,
      daily_step_goal: 8000,
      daily_water_goal_ml: 2500,
      daily_protein_goal_g: Math.round(weight * 1.6),
    };
    await saveProfile(p);
    router.replace("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{
                background: i <= step ? "var(--accent)" : "var(--surface-3)",
              }}
            />
          ))}
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight">
          {STEPS[step]}
        </h1>
        <p className="text-sm text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {step === 0 && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Driver name"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Sex (for metabolic rate)
              </span>
              <Segmented
                value={sex}
                onChange={setSex}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            </div>
            <Stepper label="Age" value={age} onChange={setAge} min={12} max={100} unit="yrs" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Stepper
              label="Height"
              value={height}
              onChange={setHeight}
              min={120}
              max={230}
              unit="cm"
            />
            <Stepper
              label="Current weight"
              value={weight}
              onChange={setWeight}
              step={0.5}
              min={30}
              max={300}
              unit="kg"
            />
            <div className="card flex items-center justify-between p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  Your BMI
                </p>
                <p className="mono text-2xl font-bold">{bmiVal.toFixed(1)}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase"
                style={{ background: `${bmiCat.color}22`, color: bmiCat.color }}
              >
                {bmiCat.label}
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Stepper
              label="Goal weight"
              value={goalWeight}
              onChange={setGoalWeight}
              step={0.5}
              min={30}
              max={300}
              unit="kg"
            />
            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Activity level
              </span>
              <div className="space-y-2">
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setActivity(a)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                      activity === a
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface-2"
                    }`}
                  >
                    {ACTIVITY_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
            {goalType !== "maintain" && (
              <Stepper
                label={`Weekly ${goalType} rate`}
                value={rate}
                onChange={setRate}
                step={0.1}
                min={0.1}
                max={1}
                unit="kg/wk"
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Summary label="Maintenance (TDEE)" value={`${maintenance} kcal`} />
            <Summary
              label="Daily calorie target"
              value={`${target} kcal`}
              accent
            />
            <Summary
              label="Goal"
              value={
                goalType === "maintain"
                  ? "Maintain weight"
                  : `${goalType === "lose" ? "Lose" : "Gain"} to ${goalWeight} kg`
              }
            />
            <Summary label="Protein target" value={`${Math.round(weight * 1.6)} g`} />
            <p className="pt-2 text-xs text-muted">
              You can fine-tune all targets later in the Garage.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-bold uppercase tracking-wide"
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={busy}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Start racing"}
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card flex items-center justify-between p-4">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`mono text-base font-bold ${accent ? "text-accent" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
