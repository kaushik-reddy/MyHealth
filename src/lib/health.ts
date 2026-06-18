import type { ActivityLevel, GoalType, Profile, Sex } from "./types";

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
      date: d.toISOString().slice(0, 10),
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

export const todayKey = () => new Date().toISOString().slice(0, 10);
