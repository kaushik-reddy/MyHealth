"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type {
  DailyLog,
  FoodEntry,
  Profile,
  SugarItem,
  WeightEntry,
} from "@/lib/types";
import { LocalRepo } from "@/lib/repo-local";
import { SupabaseRepo } from "@/lib/repo-supabase";
import { emptyLog, type Repo, uid } from "@/lib/repo";
import { todayKey } from "@/lib/health";

interface StoreState {
  ready: boolean;
  demoMode: boolean;
  user: User | null;
  profile: Profile | null;
  logs: DailyLog[];
  foodsToday: FoodEntry[];
  sugarItems: SugarItem[];
  weights: WeightEntry[];

  saveProfile: (p: Profile) => Promise<void>;
  todayLog: DailyLog;
  updateTodayLog: (patch: Partial<DailyLog>) => Promise<void>;
  addFood: (food: Omit<FoodEntry, "log_date">) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  upsertSugarItem: (item: SugarItem) => Promise<void>;
  logSugarItem: (item: SugarItem) => Promise<void>;
  deleteSugarItem: (id: string) => Promise<void>;
  addWeight: (kg: number) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<StoreState | null>(null);

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [foodsToday, setFoodsToday] = useState<FoodEntry[]>([]);
  const [sugarItems, setSugarItems] = useState<SugarItem[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  const repoRef = useRef<Repo>(new LocalRepo());
  const demoMode = !supabaseConfigured;

  const loadAll = useCallback(async () => {
    const repo = repoRef.current;
    const today = todayKey();
    const [p, lg, fd, sg, wt] = await Promise.all([
      repo.getProfile(),
      repo.getLogs(),
      repo.getFoods(today),
      repo.getSugarItems(),
      repo.getWeights(),
    ]);
    setProfile(p);
    setLogs(lg);
    setFoodsToday(fd);
    setSugarItems(sg);
    setWeights(wt);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (supabaseConfigured) {
        const sb = createClient();
        const {
          data: { user: u },
        } = await sb.auth.getUser();
        if (!active) return;
        setUser(u);
        repoRef.current = u
          ? new SupabaseRepo(sb, u.id)
          : new LocalRepo();
        sb.auth.onAuthStateChange((_e, session) => {
          const next = session?.user ?? null;
          setUser(next);
          repoRef.current = next
            ? new SupabaseRepo(sb, next.id)
            : new LocalRepo();
          loadAll();
        });
      } else {
        repoRef.current = new LocalRepo();
      }
      await loadAll();
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [loadAll]);

  const today = todayKey();
  const todayLog = useMemo(
    () => logs.find((l) => l.log_date === today) ?? emptyLog(today),
    [logs, today]
  );

  const saveProfile = useCallback(async (p: Profile) => {
    await repoRef.current.saveProfile(p);
    setProfile(p);
  }, []);

  const updateTodayLog = useCallback(
    async (patch: Partial<DailyLog>) => {
      const base = logs.find((l) => l.log_date === today) ?? emptyLog(today);
      const next = { ...base, ...patch, log_date: today };
      await repoRef.current.saveLog(next);
      setLogs((prev) => {
        const others = prev.filter((l) => l.log_date !== today);
        return [...others, next].sort((a, b) =>
          a.log_date.localeCompare(b.log_date)
        );
      });
    },
    [logs, today]
  );

  const recalcFoodTotals = useCallback(
    async (foods: FoodEntry[]) => {
      const calories = foods.reduce((s, f) => s + (f.calories || 0), 0);
      const sugar = foods.reduce((s, f) => s + (f.sugar_g || 0), 0);
      const protein = foods.reduce((s, f) => s + (f.protein_g || 0), 0);
      await updateTodayLog({
        calories_intake: Math.round(calories),
        sugar_g: Math.round(sugar * 10) / 10,
        protein_g: Math.round(protein * 10) / 10,
      });
    },
    [updateTodayLog]
  );

  const addFood = useCallback(
    async (food: Omit<FoodEntry, "log_date">) => {
      const entry: FoodEntry = { ...food, log_date: today, id: food.id ?? uid() };
      const saved = await repoRef.current.addFood(entry);
      const next = [...foodsToday, saved];
      setFoodsToday(next);
      await recalcFoodTotals(next);
    },
    [foodsToday, today, recalcFoodTotals]
  );

  const deleteFood = useCallback(
    async (id: string) => {
      await repoRef.current.deleteFood(id);
      const next = foodsToday.filter((f) => f.id !== id);
      setFoodsToday(next);
      await recalcFoodTotals(next);
    },
    [foodsToday, recalcFoodTotals]
  );

  const upsertSugarItem = useCallback(async (item: SugarItem) => {
    const saved = await repoRef.current.upsertSugarItem(item);
    setSugarItems((prev) => {
      const others = prev.filter((i) => i.id !== saved.id);
      return [...others, saved];
    });
  }, []);

  const logSugarItem = useCallback(
    async (item: SugarItem) => {
      // Add as a snack food entry and bump the item's counter.
      await addFood({
        name: item.name,
        meal_type: "snack",
        calories: Math.round(item.sugar_g * 4),
        sugar_g: item.sugar_g,
        protein_g: 0,
      });
      await upsertSugarItem({
        ...item,
        times_logged: (item.times_logged || 0) + 1,
      });
    },
    [addFood, upsertSugarItem]
  );

  const deleteSugarItem = useCallback(async (id: string) => {
    await repoRef.current.deleteSugarItem(id);
    setSugarItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addWeight = useCallback(
    async (kg: number) => {
      const entry: WeightEntry = { entry_date: today, weight_kg: kg };
      await repoRef.current.addWeight(entry);
      setWeights((prev) => {
        const others = prev.filter((w) => w.entry_date !== today);
        return [...others, entry].sort((a, b) =>
          a.entry_date.localeCompare(b.entry_date)
        );
      });
      await updateTodayLog({ weight_kg: kg });
      if (profile) {
        await saveProfile({ ...profile, current_weight_kg: kg });
      }
    },
    [today, updateTodayLog, profile, saveProfile]
  );

  const signOut = useCallback(async () => {
    if (supabaseConfigured) {
      const sb = createClient();
      await sb.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, []);

  const value: StoreState = {
    ready,
    demoMode,
    user,
    profile,
    logs,
    foodsToday,
    sugarItems,
    weights,
    saveProfile,
    todayLog,
    updateTodayLog,
    addFood,
    deleteFood,
    upsertSugarItem,
    logSugarItem,
    deleteSugarItem,
    addWeight,
    refresh: loadAll,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
