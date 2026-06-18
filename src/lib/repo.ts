import type {
  DailyLog,
  FoodEntry,
  FoodLibraryItem,
  Profile,
  SugarItem,
  WeightEntry,
} from "./types";

export interface Repo {
  getProfile(): Promise<Profile | null>;
  saveProfile(p: Profile): Promise<void>;

  getLog(date: string): Promise<DailyLog | null>;
  getLogs(): Promise<DailyLog[]>;
  saveLog(log: DailyLog): Promise<void>;

  getFoods(date: string): Promise<FoodEntry[]>;
  getFoodsSince(date: string): Promise<FoodEntry[]>;
  addFood(food: FoodEntry): Promise<FoodEntry>;
  deleteFood(id: string): Promise<void>;

  getFoodLibrary(): Promise<FoodLibraryItem[]>;
  upsertFoodLibrary(item: FoodLibraryItem): Promise<FoodLibraryItem>;
  deleteFoodLibrary(id: string): Promise<void>;

  getSugarItems(): Promise<SugarItem[]>;
  upsertSugarItem(item: SugarItem): Promise<SugarItem>;
  deleteSugarItem(id: string): Promise<void>;

  getWeights(): Promise<WeightEntry[]>;
  addWeight(entry: WeightEntry): Promise<void>;
}

export function emptyLog(date: string): DailyLog {
  return {
    log_date: date,
    steps: 0,
    distance_km: 0,
    active_calories: 0,
    calories_intake: 0,
    sugar_g: 0,
    protein_g: 0,
    water_ml: 0,
    weight_kg: null,
    mood: null,
    notes: null,
  };
}

export function uid() {
  // Generate a real UUID so ids are valid for Supabase `uuid` columns as well
  // as localStorage. Falls back to a manual v4 if crypto.randomUUID is missing.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
