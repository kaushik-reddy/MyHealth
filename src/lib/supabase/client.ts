import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when Supabase env vars are real (not blank and not the
 * placeholders from `.env.example`). This prevents a misconfigured deploy
 * from breaking the app — it transparently falls back to local storage.
 */
export const supabaseConfigured =
  !!URL &&
  !!KEY &&
  URL.startsWith("https://") &&
  URL.includes(".supabase.co") &&
  !URL.includes("YOUR-PROJECT") &&
  !KEY.includes("YOUR-");

export function createClient() {
  return createBrowserClient(URL!, KEY!);
}
