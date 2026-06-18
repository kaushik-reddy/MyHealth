import type {
  DailyLog,
  FoodEntry,
  FoodLibraryItem,
  MoodEntry,
  Profile,
  SugarItem,
  WeightEntry,
} from "./types";
import type { Repo } from "./repo";

/**
 * Wraps a primary repo (Supabase) with a local cache (localStorage).
 *
 * - Every WRITE goes to the local cache first (so data always persists and the
 *   dashboard always reflects it), then best-effort to the primary.
 * - Every READ tries the primary; if it throws or returns nothing, the cached
 *   value is used.
 *
 * This makes the app resilient to an unconfigured / out-of-date / offline
 * Supabase backend — onboarding and food logs never silently disappear.
 */
export class HybridRepo implements Repo {
  constructor(
    private primary: Repo,
    private cache: Repo
  ) {}

  // ---------- profile ----------
  async getProfile() {
    try {
      const p = await this.primary.getProfile();
      if (p) {
        await this.cache.saveProfile(p);
        return p;
      }
    } catch {
      /* fall through to cache */
    }
    return this.cache.getProfile();
  }

  async saveProfile(p: Profile) {
    await this.cache.saveProfile(p);
    try {
      await this.primary.saveProfile(p);
    } catch {
      /* keep local copy; will re-sync on next save */
    }
  }

  // ---------- daily logs ----------
  async getLogs() {
    try {
      const rows = await this.primary.getLogs();
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getLogs();
  }

  async getLog(date: string) {
    try {
      const row = await this.primary.getLog(date);
      if (row) return row;
    } catch {
      /* fall through */
    }
    return this.cache.getLog(date);
  }

  async saveLog(log: DailyLog) {
    await this.cache.saveLog(log);
    try {
      await this.primary.saveLog(log);
    } catch {
      /* keep local */
    }
  }

  // ---------- food entries ----------
  async getFoods(date: string) {
    try {
      const rows = await this.primary.getFoods(date);
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getFoods(date);
  }

  async getFoodsSince(date: string) {
    try {
      const rows = await this.primary.getFoodsSince(date);
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getFoodsSince(date);
  }

  async addFood(food: FoodEntry) {
    const saved = await this.cache.addFood(food);
    try {
      await this.primary.addFood(saved);
    } catch {
      /* keep local */
    }
    return saved;
  }

  async deleteFood(id: string) {
    await this.cache.deleteFood(id);
    try {
      await this.primary.deleteFood(id);
    } catch {
      /* ignore */
    }
  }

  // ---------- food library ----------
  async getFoodLibrary() {
    try {
      const rows = await this.primary.getFoodLibrary();
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getFoodLibrary();
  }

  async upsertFoodLibrary(item: FoodLibraryItem) {
    const saved = await this.cache.upsertFoodLibrary(item);
    try {
      await this.primary.upsertFoodLibrary(saved);
    } catch {
      /* keep local */
    }
    return saved;
  }

  async deleteFoodLibrary(id: string) {
    await this.cache.deleteFoodLibrary(id);
    try {
      await this.primary.deleteFoodLibrary(id);
    } catch {
      /* ignore */
    }
  }

  // ---------- sugar items ----------
  async getSugarItems() {
    try {
      const rows = await this.primary.getSugarItems();
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getSugarItems();
  }

  async upsertSugarItem(item: SugarItem) {
    const saved = await this.cache.upsertSugarItem(item);
    try {
      await this.primary.upsertSugarItem(saved);
    } catch {
      /* keep local */
    }
    return saved;
  }

  async deleteSugarItem(id: string) {
    await this.cache.deleteSugarItem(id);
    try {
      await this.primary.deleteSugarItem(id);
    } catch {
      /* ignore */
    }
  }

  // ---------- weights ----------
  async getWeights() {
    try {
      const rows = await this.primary.getWeights();
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getWeights();
  }

  async addWeight(entry: WeightEntry) {
    await this.cache.addWeight(entry);
    try {
      await this.primary.addWeight(entry);
    } catch {
      /* keep local */
    }
  }

  // ---------- moods ----------
  async getMoods() {
    try {
      const rows = await this.primary.getMoods();
      if (rows.length) return rows;
    } catch {
      /* fall through */
    }
    return this.cache.getMoods();
  }

  async addMood(entry: MoodEntry) {
    const saved = await this.cache.addMood(entry);
    try {
      await this.primary.addMood(saved);
    } catch {
      /* keep local */
    }
    return saved;
  }

  async deleteMood(id: string) {
    await this.cache.deleteMood(id);
    try {
      await this.primary.deleteMood(id);
    } catch {
      /* ignore */
    }
  }
}
