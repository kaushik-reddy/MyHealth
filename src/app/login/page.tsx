"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import Background from "@/components/Background";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const sb = createClient();
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setInfo(
          "Account created. If email confirmation is on, check your inbox, then sign in."
        );
        setMode("signin");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Background />
      <div className="mb-8 text-center">
        <div className="speed-tab mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <span className="mono text-2xl font-black text-white">MH</span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">MyHealth</h1>
        <p className="mt-1 text-sm text-muted">
          Your personal wellness companion
        </p>
      </div>

      {supabaseConfigured ? (
        <form onSubmit={submit} className="card space-y-3 p-5">
          <div className="flex rounded-lg border border-border bg-surface-2 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition ${
                  mode === m ? "bg-accent text-white" : "text-muted"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <Field
              label="Name"
              value={name}
              onChange={setName}
              type="text"
              placeholder="Alex Carter"
            />
          )}
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            required
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
            required
          />

          {error && <p className="text-xs text-accent">{error}</p>}
          {info && <p className="text-xs text-green">{info}</p>}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
          >
            {busy ? "Signing in…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      ) : (
        <div className="card space-y-4 p-5 text-center">
          <p className="text-sm text-muted">
            Supabase isn&apos;t configured yet. You can explore everything in{" "}
            <span className="font-semibold text-accent-3">demo mode</span> —
            data is saved on this device only.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="w-full rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wide text-white"
          >
            Enter demo mode
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
