export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "lose" | "maintain" | "gain";

export interface Profile {
  id: string;
  full_name: string | null;
  sex: Sex;
  age: number;
  height_cm: number;
  start_weight_kg: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  goal_type: GoalType;
  activity_level: ActivityLevel;
  weekly_rate_kg: number; // desired kg change per week (positive number)
  daily_calorie_target: number;
  daily_sugar_limit_g: number;
  daily_step_goal: number;
  daily_water_goal_ml: number;
  daily_protein_goal_g: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyLog {
  id?: string;
  user_id?: string;
  log_date: string; // YYYY-MM-DD
  steps: number;
  distance_km: number;
  active_calories: number; // burned via activity
  calories_intake: number;
  sugar_g: number;
  protein_g: number;
  water_ml: number;
  weight_kg: number | null;
  mood: string | null;
  notes: string | null;
}

export type FoodSource = "home" | "swiggy" | "zomato" | "dinein" | "other";

export interface FoodEntry {
  id?: string;
  user_id?: string;
  log_date: string;
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  sugar_g: number;
  protein_g: number;
  quantity?: number;
  serving_label?: string | null;
  source?: FoodSource;
  cost?: number; // money spent (₹) — for outside orders / dine-in
  created_at?: string;
}

/** A remembered food — macros are per single serving. */
export interface FoodLibraryItem {
  id?: string;
  user_id?: string;
  name: string;
  serving_label: string; // e.g. "1 medium", "100 g", "1 cup"
  calories: number;
  sugar_g: number;
  protein_g: number;
  category: string | null;
  times_used: number;
  default_source?: FoodSource; // outside items default to a delivery/dine-in source
  default_cost?: number; // typical price to pre-fill the spend field
  created_at?: string;
}

export interface SugarItem {
  id?: string;
  user_id?: string;
  name: string;
  sugar_g: number;
  category: string | null;
  avoid: boolean;
  times_logged: number;
  note: string | null;
  created_at?: string;
}

export interface WeightEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  weight_kg: number;
}
