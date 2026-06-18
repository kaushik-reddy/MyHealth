import type {
  DailyLog,
  FoodEntry,
  FoodLibraryItem,
  Profile,
  SugarItem,
  WeightEntry,
} from "./types";
import { type Repo, uid } from "./repo";

const KEYS = {
  profile: "mh:profile",
  logs: "mh:logs",
  foods: "mh:foods",
  library: "mh:library",
  sugar: "mh:sugar",
  weights: "mh:weights",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Demo / offline repository backed by the browser's localStorage. */
export class LocalRepo implements Repo {
  async getProfile() {
    return read<Profile | null>(KEYS.profile, null);
  }
  async saveProfile(p: Profile) {
    write(KEYS.profile, p);
  }

  async getLogs() {
    return read<DailyLog[]>(KEYS.logs, []);
  }
  async getLog(date: string) {
    const logs = await this.getLogs();
    return logs.find((l) => l.log_date === date) ?? null;
  }
  async saveLog(log: DailyLog) {
    const logs = await this.getLogs();
    const idx = logs.findIndex((l) => l.log_date === log.log_date);
    if (idx >= 0) logs[idx] = log;
    else logs.push(log);
    write(KEYS.logs, logs);
  }

  async getFoods(date: string) {
    const all = read<FoodEntry[]>(KEYS.foods, []);
    return all.filter((f) => f.log_date === date);
  }
  async getFoodsSince(date: string) {
    const all = read<FoodEntry[]>(KEYS.foods, []);
    return all.filter((f) => f.log_date >= date);
  }
  async addFood(food: FoodEntry) {
    const all = read<FoodEntry[]>(KEYS.foods, []);
    const withId = { ...food, id: food.id ?? uid() };
    all.push(withId);
    write(KEYS.foods, all);
    return withId;
  }
  async deleteFood(id: string) {
    const all = read<FoodEntry[]>(KEYS.foods, []);
    write(
      KEYS.foods,
      all.filter((f) => f.id !== id)
    );
  }

  async getFoodLibrary() {
    return read<FoodLibraryItem[]>(KEYS.library, []);
  }
  async upsertFoodLibrary(item: FoodLibraryItem) {
    const all = read<FoodLibraryItem[]>(KEYS.library, []);
    const withId = { ...item, id: item.id ?? uid() };
    const idx = all.findIndex(
      (i) =>
        i.id === withId.id ||
        i.name.toLowerCase() === withId.name.toLowerCase()
    );
    if (idx >= 0) all[idx] = { ...all[idx], ...withId, id: all[idx].id };
    else all.push(withId);
    write(KEYS.library, all);
    return idx >= 0 ? all[idx] : withId;
  }
  async deleteFoodLibrary(id: string) {
    const all = read<FoodLibraryItem[]>(KEYS.library, []);
    write(
      KEYS.library,
      all.filter((i) => i.id !== id)
    );
  }

  async getSugarItems() {
    return read<SugarItem[]>(KEYS.sugar, []);
  }
  async upsertSugarItem(item: SugarItem) {
    const all = read<SugarItem[]>(KEYS.sugar, []);
    const withId = { ...item, id: item.id ?? uid() };
    const idx = all.findIndex((i) => i.id === withId.id);
    if (idx >= 0) all[idx] = withId;
    else all.push(withId);
    write(KEYS.sugar, all);
    return withId;
  }
  async deleteSugarItem(id: string) {
    const all = read<SugarItem[]>(KEYS.sugar, []);
    write(
      KEYS.sugar,
      all.filter((i) => i.id !== id)
    );
  }

  async getWeights() {
    return read<WeightEntry[]>(KEYS.weights, []);
  }
  async addWeight(entry: WeightEntry) {
    const all = read<WeightEntry[]>(KEYS.weights, []);
    const idx = all.findIndex((w) => w.entry_date === entry.entry_date);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    write(KEYS.weights, all);
  }
}
