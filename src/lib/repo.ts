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
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}
