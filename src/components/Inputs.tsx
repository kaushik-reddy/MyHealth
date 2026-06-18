"use client";

import { useEffect, useRef, useState } from "react";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-surface-3 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            value === o.value
              ? "bg-accent text-white shadow"
              : "text-muted active:scale-95"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100000,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const clamp = (v: number) =>
    Math.min(max, Math.max(min, Math.round(v * 100) / 100));

  const [raw, setRaw] = useState(String(value));
  const focused = useRef(false);

  // Sync from parent when not typing
  useEffect(() => {
    if (!focused.current) setRaw(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setRaw(v);
    // Skip intermediate states like "7." or empty
    if (v === "" || v.endsWith(".") || v.endsWith(",")) return;
    const n = parseFloat(v);
    if (!isNaN(n)) onChange(clamp(n));
  }

  function handleBlur() {
    focused.current = false;
    const n = parseFloat(raw);
    const clamped = isNaN(n) ? value : clamp(n);
    onChange(clamped);
    setRaw(String(clamped));
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => { const next = clamp(value - step); onChange(next); setRaw(String(next)); }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-xl font-bold text-muted active:scale-90"
        >
          −
        </button>
        <div className="field flex flex-1 items-baseline justify-center gap-1 py-3">
          <input
            inputMode="decimal"
            value={raw}
            onFocus={() => { focused.current = true; }}
            onChange={handleChange}
            onBlur={handleBlur}
            className="display w-24 bg-transparent text-center text-xl font-light outline-none"
          />
          {unit && <span className="text-xs text-muted">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={() => { const next = clamp(value + step); onChange(next); setRaw(String(next)); }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
}: {
  label: string;
  value: number | "";
  onChange: (v: number) => void;
  unit?: string;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(value === "" ? "" : String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current)
      setRaw(value === "" ? "" : String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setRaw(v);
    if (v === "" || v.endsWith(".") || v.endsWith(",")) return;
    const n = parseFloat(v);
    if (!isNaN(n)) onChange(n);
  }

  function handleBlur() {
    focused.current = false;
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      onChange(n);
      setRaw(String(n));
    } else {
      setRaw(value === "" ? "" : String(value));
    }
  }

  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="field flex items-center px-3.5">
        <input
          inputMode="decimal"
          value={raw}
          placeholder={placeholder}
          onFocus={() => { focused.current = true; }}
          onChange={handleChange}
          onBlur={handleBlur}
          className="display w-full bg-transparent py-3 text-base font-light outline-none"
        />
        {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
      </div>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="field flex items-center px-3.5">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-3 text-sm outline-none"
        />
      </div>
    </label>
  );
}
