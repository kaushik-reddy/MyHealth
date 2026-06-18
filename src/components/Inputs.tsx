"use client";

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
    <div className="flex rounded-lg border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition ${
            value === o.value ? "bg-accent text-white" : "text-muted"
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
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className="h-11 w-11 shrink-0 rounded-lg border border-border bg-surface-2 text-lg font-bold active:scale-95"
        >
          −
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1 rounded-lg border border-border bg-surface-2 py-2.5">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
            className="mono w-20 bg-transparent text-center text-lg font-bold outline-none"
          />
          {unit && <span className="text-xs text-muted">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="h-11 w-11 shrink-0 rounded-lg border border-border bg-surface-2 text-lg font-bold active:scale-95"
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
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-border bg-surface-2 px-3">
        <input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="mono w-full bg-transparent py-2.5 text-sm outline-none"
        />
        {unit && <span className="text-xs text-muted">{unit}</span>}
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
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
