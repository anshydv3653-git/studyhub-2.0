# SparkAI — Setup & Deployment Guide (StudyHub 2.0)

SparkAI is your 24/7 CBSE Class 10 AI study coach, fully integrated into StudyHub 2.0.

## What's inside this update

**Your site with SparkAI Integration (20 Sep 2026):**
- **Home Page (`public/index.html`)**:
  - Features a prominent **SparkAI Hero Banner** with a large Gemini-style glowing 4-point star AI logo, feature highlights (Live Tracker Synced, Doubt Solver, Exam Schedules), and a "Chat with SparkAI" call-to-action.
  - Stylish **`✨ SparkAI` pill button** in the top navigation bar with glowing gradient border.
- **AI Backend (`app/api/ai-tutor/route.ts`)**:
  - AI Persona: **SparkAI** — trained for CBSE Class 10 board exam prep.
  - Primary AI: **Gemini 2.5 Flash** (`gemini-2.5-flash`).
  - Fallback AI: **Groq 120B** (`openai/gpt-oss-120b`).
  - Reads student's real progress & chapter completion from Supabase cookies.
- **SparkAI Chat UI (`components/AITutorChat.tsx`)**:
  - Full-screen glassmorphic interface with interactive 3D particle background (Three.js).
  - Branded SparkAI header with logo and "← Home" navigation.
- **Next.js Integration (`next.config.mjs`, `vercel.json`)**:
  - Root `/` serves your main StudyHub website.
  - `/tutor` serves SparkAI chat.
  - Same domain ensures student login cookies work seamlessly.
| `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore` | Standard Next.js project files |
| `.env.local.example` | Env-var template (Supabase values already filled in — they're the same public values from your `script.js`) |
| `supabase/ai-tutor-rls-check.sql` | Optional SQL — RLS policies for the 4 AI tables, only needed if you didn't set them up yet |

## ✅ What was verified before zipping (20 Sep 2026)

I checked your live Supabase database:

1. **All 4 tables the route needs already exist** with exactly the columns the code queries:
   `student_study_settings`, `student_chapter_progress`, `study_plan_items`, `daily_study_logs`
2. **`subject.priority_weight` and `chapters.est_hours` exist** with real data ✅
3. **Gemini model** — the route now uses **`gemini-2.5-flash`** (the latest stable/GA
   version of the 2.5 Flash family) as requested. It's fully active on the Gemini API ✅.
   (Switched from `gemini-3.8-flash` — if you ever want 3.8 back, it's a one-line change
   in the `callGemini` URL.)
4. The 4 AI tables are currently **empty** — that's fine. The tutor works immediately for Q&A;
   the "personal progress" advice fills in automatically as students' data gets logged.

## ✅ Groq fallback model — fixed

The original code used `llama-3.3-70b-versatile`, but Groq **retired that model on
16 Aug 2026** (it now returns a 404 error). `app/api/ai-tutor/route.ts` has been
updated to use **`openai/gpt-oss-120b`** — Groq's officially recommended replacement —
so if Gemini ever fails (rate limit, quota, outage), the Groq fallback still works
and the student never sees a gap.

(If you'd prefer a different fallback later, Groq's other recommended option is
`qwen/qwen3.6-27b` — just change the `model:` line inside `callGroq`.)

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # then paste your GEMINI_API_KEY and GROQ_API_KEY
npm run dev
```

Open:
- `http://localhost:3000` → **your main StudyHub site** (with the new AI Tutor 🤖 button in the nav)
- `http://localhost:3000/tutor` → **AI Study Tutor** 🎯

### Where to get the keys
- **Gemini:** https://aistudio.google.com → "Get API key" (free tier is fine to start)
- **Groq:** https://console.groq.com → "API Keys" (free tier)

Your keys go in `.env.local` only — that file is git-ignored, so they will never
be pushed to GitHub.

## Deploy on Vercel

1. Push this code to your GitHub repo (send me a GitHub token and I'll do it for you —
   the new files are already committed on a local branch called `ai-tutor`).
2. Vercel → **Add New Project** → import the repo (framework auto-detects as Next.js).
3. In the Vercel project, add these **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qijdyaorbvbvuumzdxdu.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the publishable key (in `.env.local.example`)
   - `GEMINI_API_KEY` = your key
   - `GROQ_API_KEY` = your key
4. Deploy → your main site stays at `https://your-project.vercel.app`, and the
   tutor is at `https://your-project.vercel.app/tutor` (reachable from the
   **AI Tutor 🤖** button in the site's nav)

## ✅ The "same website" rule — now handled

The AI tutor reads the student's **login session from browser cookies**, so it must run
on the **same domain** as where students log in. This is solved in this zip: your static
site (with login) and the `/tutor` page live in the **same Next.js project / same
domain**. A student who logs in on the main site clicks **AI Tutor 🤖**, and the tutor
sees their real progress — no extra login, no separate site.

(Note: while testing locally without a logged-in session, the API correctly answers
"401 Not authenticated" — that's the security working, not a bug.)

## Supabase checklist (optional)

- If your 4 AI tables already have RLS policies → nothing to do.
- If not → open Supabase → SQL Editor → run `supabase/ai-tutor-rls-check.sql`.

That's it. The AI tutor is ready. 📚
