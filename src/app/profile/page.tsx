"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Collapsible from "@/components/Collapsible";
import { NumberField, Segmented, Stepper, TextField } from "@/components/Inputs";
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
import { CheckIcon, EditIcon } from "@/components/icons";

export default function ProfilePage() {
  return (
    <AppShell title="Profile" subtitle="Tune your plan">
      <ProfileEditor />
    </AppShell>
  );
}

function ProfileEditor() {
  const { profile, saveProfile, signOut, clearAllData, demoMode, user } = useStore();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(profile);
  const [saved, setSaved] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wiped, setWiped] = useState(false);

  if (!p) return null;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP({ ...p, [key]: value });

  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 256);
      const next = { ...p!, avatar_url: dataUrl };
      setP(next);
      await saveProfile(next); // persist immediately so the top-right avatar updates
    } catch {
      /* ignore unreadable image */
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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

  async function handleWipe() {
    setWiping(true);
    try {
      await clearAllData();
      setConfirmWipe(false);
      setWiped(true);
      setTimeout(() => setWiped(false), 1600);
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-green/40 bg-green/10 px-3 py-2 text-center text-xs font-semibold text-green">
          <CheckIcon size={14} /> Saved
        </div>
      )}

      {/* identity hero */}
      <div className="card flex flex-col items-center p-6 text-center">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-surface-3"
          aria-label="Change profile picture"
        >
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
              {(p.full_name || "You")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          )}
          <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white ring-2 ring-surface-2">
            <EditIcon size={13} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickAvatar}
        />
        <p className="mt-3 text-xl font-bold">{p.full_name || "You"}</p>
        <p className="text-xs text-muted">
          {demoMode ? "Demo mode · this device" : user?.email}
        </p>

        {/* quick stats */}
        <div className="mt-5 grid w-full grid-cols-3 gap-3">
          <HeroStat label="Current" value={`${p.current_weight_kg}`} unit="kg" />
          <HeroStat label="Goal" value={`${p.goal_weight_kg}`} unit="kg" />
          <HeroStat label="BMI" value={bmiVal.toFixed(1)} unit={bmiCat.label} color={bmiCat.color} />
        </div>
      </div>

      {/* identity edit */}
      <Block title="Account" summary={p.full_name || "Set your name"}>
        <TextField
          label="Display name"
          value={p.full_name ?? ""}
          onChange={(v) => set("full_name", v)}
          placeholder="Your name"
        />
      </Block>

      {/* body */}
      <Block
        title="Body"
        summary={`${p.sex} · ${p.age} yrs · ${p.height_cm} cm · ${p.current_weight_kg} kg → ${p.goal_weight_kg} kg`}
      >
        <div>
          <span className="field-label">Sex</span>
          <Segmented
            value={p.sex}
            onChange={(v) => set("sex", v)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
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
      <Block
        title="Activity & pace"
        summary={`${ACTIVITY_LABELS[p.activity_level]}${goalType !== "maintain" ? ` · ${p.weekly_rate_kg} kg/wk` : ""}`}
      >
        <div className="space-y-2">
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
            <button
              key={a}
              onClick={() => set("activity_level", a)}
              className={`w-full rounded-xl p-3 text-left text-sm transition ${
                p.activity_level === a
                  ? "bg-accent/15 text-foreground ring-1 ring-accent"
                  : "bg-surface-3 text-muted"
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
        <button
          onClick={() => set("daily_calorie_target", recommended)}
          className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left"
        >
          <span className="text-xs text-muted">Recommended target</span>
          <span className="display text-sm text-accent-2">{recommended} kcal · use</span>
        </button>
        <p className="text-[11px] text-muted">
          BMR {Math.round(bmr(p.sex, p.current_weight_kg, p.height_cm, p.age))} kcal · Maintenance {maintenance} kcal
        </p>
      </Block>

      {/* daily targets */}
      <Block
        title="Daily targets"
        summary={`${p.daily_calorie_target} kcal · ${p.daily_sugar_limit_g}g sugar · ${p.daily_step_goal.toLocaleString()} steps`}
      >
        <div className="grid grid-cols-2 gap-2.5">
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
        className="w-full rounded-full bg-accent py-4 text-sm font-bold uppercase tracking-wider text-white transition active:scale-[0.98]"
      >
        Save changes
      </button>

      {/* danger zone */}
      <div className="rounded-2xl border border-[#f8717133] bg-[#f871710d] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#f87171]">
          Danger zone
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Permanently erase all your logged data — check-ins, foods, sugar,
          weigh-ins and moods. Your profile and account stay.
        </p>
        {wiped ? (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-green/40 bg-green/10 px-3 py-2.5 text-center text-xs font-semibold text-green">
            <CheckIcon size={14} /> All data removed
          </div>
        ) : confirmWipe ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setConfirmWipe(false)}
              disabled={wiping}
              className="flex-1 rounded-full bg-surface-2 py-3 text-xs font-bold uppercase tracking-wider text-muted transition active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleWipe}
              disabled={wiping}
              className="flex-1 rounded-full bg-[#f87171] py-3 text-xs font-bold uppercase tracking-wider text-[#0a0a0c] transition active:scale-[0.98] disabled:opacity-60"
            >
              {wiping ? "Removing…" : "Yes, delete"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmWipe(true)}
            className="mt-3 w-full rounded-full border border-[#f8717155] py-3 text-xs font-bold uppercase tracking-wider text-[#f87171] transition active:scale-[0.98]"
          >
            Remove all my data
          </button>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full rounded-full bg-surface-2 py-3.5 text-sm font-bold uppercase tracking-wider text-muted transition active:scale-[0.98]"
      >
        {demoMode ? "Reset demo / exit" : "Sign out"}
      </button>

      <p className="pb-2 text-center text-[10px] text-muted">
        MyHealth · your wellness companion · built for mobile
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-3 px-2 py-3 text-center">
      <p className="display text-xl font-light" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted">{unit}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function Block({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Collapsible title={title} summary={summary}>
      {children}
    </Collapsible>
  );
}

/** Read an image file and downscale it to a small square-ish JPEG data URL. */
function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
