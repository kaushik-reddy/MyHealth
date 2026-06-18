"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Collapsible from "@/components/Collapsible";
import { NumberField, TextField } from "@/components/Inputs";
import { useStore } from "@/lib/store";
import type { SugarItem } from "@/lib/types";
import { uid } from "@/lib/repo";

export default function SugarPage() {
  return (
    <AppShell title="Sugar" subtitle="Spot the culprits, then cut them out">
      <Sugar />
    </AppShell>
  );
}

function Sugar() {
  const {
    profile,
    todayLog,
    sugarItems,
    upsertSugarItem,
    logSugarItem,
    deleteSugarItem,
  } = useStore();
  const [name, setName] = useState("");
  const [grams, setGrams] = useState(0);
  const [category, setCategory] = useState("");

  if (!profile) return null;

  const limit = profile.daily_sugar_limit_g;
  const today = todayLog.sugar_g;
  const pct = Math.min(today / limit, 1.4);
  const over = today > limit;

  const avoidList = sugarItems.filter((i) => i.avoid);
  const watchList = sugarItems.filter((i) => !i.avoid);

  function add() {
    if (!name.trim()) return;
    const item: SugarItem = {
      id: uid(),
      name: name.trim(),
      sugar_g: grams,
      category: category.trim() || null,
      avoid: false,
      times_logged: 0,
      note: null,
    };
    upsertSugarItem(item);
    setName("");
    setGrams(0);
    setCategory("");
  }

  return (
    <div className="space-y-5">
      {/* Today's sugar gauge */}
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Today&apos;s sugar
          </h2>
          <span
            className="mono text-2xl font-black"
            style={{ color: over ? "var(--accent)" : "var(--pink)" }}
          >
            {today}
            <span className="text-sm font-medium text-muted">/{limit}g</span>
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pct * 100, 100)}%`,
              background: over
                ? "var(--accent)"
                : "linear-gradient(90deg, var(--pink), var(--accent-3))",
            }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {over
            ? `Over by ${Math.round((today - limit) * 10) / 10}g — check the avoid list 👇`
            : `${Math.round((limit - today) * 10) / 10}g of headroom left today`}
        </p>
      </div>

      {/* Quick add an item */}
      <Collapsible title="Add a sugary item" tint="var(--pink)" summary="Tap to add an item you eat often">
        <TextField label="Item" value={name} onChange={setName} placeholder="e.g. Cola can" />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Sugar" value={grams} onChange={setGrams} unit="g" />
          <TextField label="Category" value={category} onChange={setCategory} placeholder="Drink" />
        </div>
        <button
          onClick={add}
          className="w-full rounded-lg bg-accent py-2.5 text-xs font-bold uppercase tracking-wide text-white"
        >
          Save item
        </button>
      </Collapsible>

      {/* Watch list */}
      <ItemList
        title="My items"
        empty="Add items you eat often to track their sugar."
        items={watchList}
        onLog={logSugarItem}
        onToggleAvoid={(i) => upsertSugarItem({ ...i, avoid: true })}
        onDelete={(id) => deleteSugarItem(id)}
        avoidMode={false}
      />

      {/* Avoid list */}
      <ItemList
        title="🚫 Avoid list"
        empty="Nothing flagged yet. Move repeat offenders here."
        items={avoidList}
        onLog={logSugarItem}
        onToggleAvoid={(i) => upsertSugarItem({ ...i, avoid: false })}
        onDelete={(id) => deleteSugarItem(id)}
        avoidMode
      />
    </div>
  );
}

function ItemList({
  title,
  empty,
  items,
  onLog,
  onToggleAvoid,
  onDelete,
  avoidMode,
}: {
  title: string;
  empty: string;
  items: SugarItem[];
  onLog: (i: SugarItem) => void;
  onToggleAvoid: (i: SugarItem) => void;
  onDelete: (id: string) => void;
  avoidMode: boolean;
}) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-muted">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items
            .slice()
            .sort((a, b) => b.times_logged - a.times_logged)
            .map((i) => (
              <div
                key={i.id}
                className={`rounded-lg border px-3 py-2.5 ${
                  avoidMode
                    ? "border-accent/40 bg-accent/5"
                    : "border-border bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {i.name}
                      {i.times_logged >= 3 && !avoidMode && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-accent-3">
                          frequent
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted">
                      {i.sugar_g}g sugar
                      {i.category ? ` · ${i.category}` : ""} · logged {i.times_logged}×
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onLog(i)}
                    className="flex-1 rounded-md bg-surface-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
                  >
                    + Log today
                  </button>
                  <button
                    onClick={() => onToggleAvoid(i)}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                      avoidMode ? "bg-surface-3" : "bg-accent/20 text-accent"
                    }`}
                  >
                    {avoidMode ? "Unflag" : "Avoid"}
                  </button>
                  <button
                    onClick={() => i.id && onDelete(i.id)}
                    className="rounded-md px-3 py-1.5 text-[11px] text-muted"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
