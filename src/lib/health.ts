import type { ActivityLevel, DailyLog, GoalType, Profile, Sex } from "./types";

/** Energy density of body fat: ~7700 kcal per kg. */
export const KCAL_PER_KG = 7700;

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary · desk job",
  light: "Light · 1-3 days/wk",
  moderate: "Moderate · 3-5 days/wk",
  active: "Active · 6-7 days/wk",
  very_active: "Athlete · 2x/day",
};

/** Mifflin-St Jeor Basal Metabolic Rate. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure (maintenance calories). */
export function tdee(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
  activity: ActivityLevel
) {
  return Math.round(bmr(sex, weightKg, heightCm, age) * ACTIVITY_FACTORS[activity]);
}

/** Body Mass Index. */
export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number) {
  if (value < 18.5) return { label: "Underweight", color: "#fbbf24" };
  if (value < 25) return { label: "Healthy", color: "#36d399" };
  if (value < 30) return { label: "Overweight", color: "#fbbf24" };
  return { label: "Obese", color: "#e10600" };
}

/** Recommended daily calorie target given a goal and weekly rate. */
export function calorieTarget(
  maintenance: number,
  goal: GoalType,
  weeklyRateKg: number
) {
  const dailyDelta = (weeklyRateKg * KCAL_PER_KG) / 7;
  let target = maintenance;
  if (goal === "lose") target = maintenance - dailyDelta;
  if (goal === "gain") target = maintenance + dailyDelta;
  // Safety floor.
  return Math.max(1200, Math.round(target));
}

/** Steps -> distance (km). Average stride derived from height. */
export function stepsToKm(steps: number, heightCm: number) {
  const strideM = heightCm * 0.00414; // ~0.414 * height in m
  return (steps * strideM) / 1000;
}

/** Calories burned walking a given distance for a given body weight. */
export function walkingCalories(distanceKm: number, weightKg: number) {
  // ~0.5 kcal per kg per km walking.
  return Math.round(distanceKm * weightKg * 0.5);
}

export interface ProjectionPoint {
  date: string;
  weight: number;
  target: number;
}

/**
 * Project weight over time from a steady net daily calorie balance.
 * Returns daily points until the goal is hit (or `maxDays`).
 */
export function projectWeight(
  profile: Pick<
    Profile,
    | "current_weight_kg"
    | "goal_weight_kg"
    | "height_cm"
    | "sex"
    | "age"
    | "activity_level"
  >,
  avgIntake: number,
  avgActiveBurn: number,
  maxDays = 365
): { points: ProjectionPoint[]; reachDays: number | null } {
  const points: ProjectionPoint[] = [];
  const losing = profile.goal_weight_kg < profile.current_weight_kg;
  let weight = profile.current_weight_kg;
  let reachDays: number | null = null;

  const today = new Date();
  for (let day = 0; day <= maxDays; day++) {
    const maintenance = tdee(
      profile.sex,
      weight,
      profile.height_cm,
      profile.age,
      profile.activity_level
    );
    const expenditure = maintenance + avgActiveBurn;
    const netDeficit = expenditure - avgIntake; // +ve => losing
    const dailyKgChange = netDeficit / KCAL_PER_KG;

    const d = new Date(today);
    d.setDate(d.getDate() + day);
    points.push({
      date: dateKey(d),
      weight: Math.round(weight * 10) / 10,
      target: profile.goal_weight_kg,
    });

    const reached = losing
      ? weight <= profile.goal_weight_kg
      : weight >= profile.goal_weight_kg;
    if (reached && reachDays === null) {
      reachDays = day;
      // continue a little to show the plateau then stop.
      if (day > 0) break;
    }

    weight -= dailyKgChange;
    // Clamp once goal is essentially met to avoid overshoot in the chart.
    if (losing && weight < profile.goal_weight_kg) weight = profile.goal_weight_kg;
    if (!losing && weight > profile.goal_weight_kg) weight = profile.goal_weight_kg;
  }

  return { points, reachDays };
}

export function formatReachDate(reachDays: number | null) {
  if (reachDays === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + reachDays);
  return d;
}

/** Format a Date as a local YYYY-MM-DD key (timezone-safe, never shifts day). */
export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayKey = () => dateKey(new Date());

/** Add (or subtract) days to a YYYY-MM-DD key without timezone drift. */
export function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

type DayGoals = Pick<
  Profile,
  | "daily_calorie_target"
  | "daily_step_goal"
  | "daily_protein_goal_g"
  | "daily_water_goal_ml"
  | "daily_sugar_limit_g"
>;

/**
 * Overall daily completion across the five tracked goals (0..1).
 * Calories/steps/protein/water count toward their target; sugar rewards
 * staying under the limit. Returns 0 when nothing has been logged.
 */
export function dayProgress(
  log: DailyLog | undefined,
  goals: DayGoals
): number {
  if (!log) return 0;
  const anyLogged =
    log.calories_intake > 0 ||
    log.steps > 0 ||
    log.protein_g > 0 ||
    log.water_ml > 0 ||
    log.sugar_g > 0;
  if (!anyLogged) return 0;

  const ratio = (value: number, max: number) =>
    max > 0 ? Math.min(value / max, 1) : 0;
  const invert = (value: number, max: number) =>
    max > 0 ? (value <= max ? 1 : Math.max(0, max / value)) : 0;

  const parts = [
    ratio(log.calories_intake, goals.daily_calorie_target),
    ratio(log.steps, goals.daily_step_goal),
    ratio(log.protein_g, goals.daily_protein_goal_g),
    ratio(log.water_ml, goals.daily_water_goal_ml),
    invert(log.sugar_g, goals.daily_sugar_limit_g),
  ];
  return parts.reduce((s, p) => s + p, 0) / parts.length;
}

/** Color for a 0..1 progress value — green when complete, warmer as it drops. */
export function progressColor(pct: number): string {
  if (pct >= 1) return "#34d399"; // green — achieved
  if (pct >= 0.75) return "#38bdf8"; // sky blue
  if (pct >= 0.5) return "#3b82f6"; // blue
  if (pct >= 0.25) return "#facc15"; // amber
  return "#fb7185"; // rose — just getting started
}
