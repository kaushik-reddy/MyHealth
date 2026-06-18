import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DailyLog,
  FoodEntry,
  FoodLibraryItem,
  Profile,
  SugarItem,
  WeightEntry,
} from "./types";
import { type Repo } from "./repo";

/** Supabase-backed repository scoped to the signed-in user via RLS. */
export class SupabaseRepo implements Repo {
  constructor(
    private sb: SupabaseClient,
    private userId: string
  ) {}

  async getProfile() {
    const { data } = await this.sb
      .from("profiles")
      .select("*")
      .eq("id", this.userId)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  }

  async saveProfile(p: Profile) {
    const row = { ...p, id: this.userId, updated_at: new Date().toISOString() };
    const { error } = await this.sb.from("profiles").upsert(row);
    if (error) throw error;
  }

  async getLogs() {
    const { data } = await this.sb
      .from("daily_logs")
      .select("*")
      .eq("user_id", this.userId)
      .order("log_date", { ascending: true });
    return (data as DailyLog[]) ?? [];
  }

  async getLog(date: string) {
    const { data } = await this.sb
      .from("daily_logs")
      .select("*")
      .eq("user_id", this.userId)
      .eq("log_date", date)
      .maybeSingle();
    return (data as DailyLog | null) ?? null;
  }

  async saveLog(log: DailyLog) {
    const row = { ...log, user_id: this.userId };
    const { error } = await this.sb
      .from("daily_logs")
      .upsert(row, { onConflict: "user_id,log_date" });
    if (error) throw error;
  }

  async getFoods(date: string) {
    const { data } = await this.sb
      .from("food_entries")
      .select("*")
      .eq("user_id", this.userId)
      .eq("log_date", date)
      .order("created_at", { ascending: true });
    return (data as FoodEntry[]) ?? [];
  }

  async getFoodsSince(date: string) {
    const { data } = await this.sb
      .from("food_entries")
      .select("*")
      .eq("user_id", this.userId)
      .gte("log_date", date)
      .order("log_date", { ascending: true });
    return (data as FoodEntry[]) ?? [];
  }

  async addFood(food: FoodEntry) {
    const row = { ...food, user_id: this.userId };
    const { data, error } = await this.sb
      .from("food_entries")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as FoodEntry;
  }

  async deleteFood(id: string) {
    await this.sb.from("food_entries").delete().eq("id", id);
  }

  async getFoodLibrary() {
    const { data } = await this.sb
      .from("food_library")
      .select("*")
      .eq("user_id", this.userId)
      .order("times_used", { ascending: false });
    return (data as FoodLibraryItem[]) ?? [];
  }

  async upsertFoodLibrary(item: FoodLibraryItem) {
    const row = { ...item, user_id: this.userId };
    const { data, error } = await this.sb
      .from("food_library")
      .upsert(row, { onConflict: "user_id,name" })
      .select()
      .single();
    if (error) throw error;
    return data as FoodLibraryItem;
  }

  async deleteFoodLibrary(id: string) {
    await this.sb.from("food_library").delete().eq("id", id);
  }

  async getSugarItems() {
    const { data } = await this.sb
      .from("sugar_items")
      .select("*")
      .eq("user_id", this.userId)
      .order("times_logged", { ascending: false });
    return (data as SugarItem[]) ?? [];
  }

  async upsertSugarItem(item: SugarItem) {
    const row = { ...item, user_id: this.userId };
    const { data, error } = await this.sb
      .from("sugar_items")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return data as SugarItem;
  }

  async deleteSugarItem(id: string) {
    await this.sb.from("sugar_items").delete().eq("id", id);
  }

  async getWeights() {
    const { data } = await this.sb
      .from("weight_entries")
      .select("*")
      .eq("user_id", this.userId)
      .order("entry_date", { ascending: true });
    return (data as WeightEntry[]) ?? [];
  }

  async addWeight(entry: WeightEntry) {
    const row = { ...entry, user_id: this.userId };
    const { error } = await this.sb
      .from("weight_entries")
      .upsert(row, { onConflict: "user_id,entry_date" });
    if (error) throw error;
  }
}
