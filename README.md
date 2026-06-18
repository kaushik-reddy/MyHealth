# 🏁 MyHealth — Box Box

A **mobile-first** health & fitness tracker styled after the **Box Box F1** app — dark
telemetry UI, timing-screen numerals, and racing accents. Track sugar, steps,
calories and water, log your meals, flag the foods that spike your sugar, and watch a
live **projection chart** estimate the date you'll hit your goal weight.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind v4**, **Supabase**
(auth + Postgres) and **Recharts**, deployed on **Vercel**.

> The app also runs in **demo mode** (no backend) using the browser's `localStorage`,
> so you can try every feature before wiring Supabase.

---

## ✨ Features

- **F1 "paddock" dashboard** — energy-balance hero, Apple-style activity rings
  (intake / steps / sugar / water), BMI, streak and distance.
- **Daily check-in** — steps → auto distance + walking calories, hydration quick-add,
  food diary (calories / sugar / protein per meal), weigh-in, mood & notes.
- **Sugar tracker & avoid list** — log recurring sugary items, see "frequent offenders",
  and move repeat culprits to a 🚫 **avoid list** so you skip them next time.
- **Weight-goal projection** — Mifflin-St Jeor BMR → TDEE, calorie deficit math
  (7700 kcal/kg) draws an estimated **finish-line date** and a projected vs. actual
  weight chart.
- **Onboarding wizard** — sex, age, height, weight, goal, activity level → recommended
  calorie / protein targets.
- **Garage (profile)** — tune every daily target, activity, and pace.
- **PWA** — installable, standalone, mobile-optimized.

---

## 🚀 Quick start (local)

```bash
npm install
cp .env.example .env.local   # optional — leave blank to use demo mode
npm run dev                  # http://localhost:3000
```

Without `.env.local` the app runs in **demo mode**. Add your Supabase keys to enable
real accounts and cloud sync.

---

## 🟢 Connect Supabase

### 1. Create the project
1. Go to <https://supabase.com> → **New project**. Pick a name, a strong DB password,
   and a region close to you.
2. Wait for it to provision (~1 min).

### 2. Create the database schema
1. In the Supabase dashboard open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click
   **Run**. This creates the `profiles`, `daily_logs`, `food_entries`, `sugar_items`
   and `weight_entries` tables, **Row Level Security** policies (each row is private to
   its owner), and a trigger that auto-creates a profile row on sign-up.

### 3. Grab your API keys
1. **Project Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Put them in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-anon-key
   ```

### 4. Configure Auth
1. **Authentication → Providers → Email**: enable it.
   - For the fastest local testing you can turn **"Confirm email" off**.
   - If you keep it on, users must click the confirmation link before signing in.
2. **Authentication → URL Configuration**: set **Site URL** to your local
   `http://localhost:3000` and, after deploying, add your Vercel URL (e.g.
   `https://myhealth.vercel.app`) under **Redirect URLs**.

Restart `npm run dev` — the yellow **Demo** badge disappears and the login screen now
offers real sign-up / sign-in.

---

## ▲ Deploy to Vercel

### Option A — Vercel dashboard (recommended)
1. Push this repo to GitHub (configured at
   `https://github.com/kaushik-reddy/MyHealth.git`).
2. Go to <https://vercel.com> → **Add New… → Project** → **Import** the `MyHealth` repo.
3. Vercel auto-detects **Next.js** (build `next build`, output handled automatically).
4. Under **Environment Variables**, add the same two keys for **Production**
   (and Preview/Development if you want):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-ref.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `YOUR-anon-key` |

5. Click **Deploy**. You'll get a `https://<project>.vercel.app` URL.
6. Back in **Supabase → Authentication → URL Configuration**, add that Vercel URL to
   **Site URL / Redirect URLs**.

### Option B — Vercel CLI
```bash
npm i -g vercel
vercel                 # link & first deploy (preview)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod          # production deploy
```

> Once the GitHub repo is linked, every push to `main` triggers an automatic Vercel
> deployment.

---

## 🔐 Security notes

- The `anon` key is **safe to expose** in the browser — all access is gated by Supabase
  **Row Level Security**, which this schema enables on every table (`auth.uid() = user_id`).
- Never commit `.env.local` (it's already in `.gitignore`); use Vercel/Supabase env vars.
- Do **not** put the Supabase `service_role` key in this app.

---

## 🧱 Project structure

```
src/
  app/
    page.tsx          # Paddock dashboard
    checkin/          # Daily check-in (steps, water, food, weigh-in)
    sugar/            # Sugar tracker + avoid list
    progress/         # Projection chart + weigh-in history
    profile/          # Garage — targets & setup
    onboarding/       # First-run wizard
    login/            # Supabase auth (or demo entry)
  components/         # Ring, BottomNav, TopBar, AppShell, Inputs
  lib/
    health.ts         # BMR / TDEE / BMI / projection math
    store.tsx         # React context — auth + data
    repo*.ts          # Supabase + localStorage repositories
    supabase/         # Browser/server clients + session proxy
  proxy.ts            # Route protection (Next 16 proxy convention)
supabase/schema.sql   # Database schema + RLS + trigger
```

## 🧮 The projection model

```
BMR  = Mifflin-St Jeor(sex, weight, height, age)
TDEE = BMR × activity factor
net daily deficit = (TDEE + active calories) − calorie intake
weight change/day  = deficit ÷ 7700 kcal/kg
```

The chart iterates this day-by-day (recomputing TDEE as weight changes) until your goal
weight is reached, giving an estimated finish-line date.

---

Built for fun & fitness. Lights out and away we go. 🏎️
