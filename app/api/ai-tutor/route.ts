// app/api/ai-tutor/route.ts
//
// AI Study Tutor endpoint.
// - Reads the logged-in student's real progress from Supabase
//   (student_study_settings, chapters, student_chapter_progress,
//   study_plan_items, daily_study_logs).
// - Builds a compact context summary (not a raw data dump — keeps
//   token usage low).
// - Calls Gemini 2.5 Flash first. If Gemini errors out (rate limit,
//   quota, or any failure), automatically retries the same request
//   on Groq (llama-3.3-70b-versatile) so the student never sees a gap.
//
// ENV VARS REQUIRED (add to .env.local and your Vercel project):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   GEMINI_API_KEY
//   GROQ_API_KEY
//
// Requires: npm install @supabase/ssr

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// ---------------------------------------------------------------
// Supabase server client (uses the student's own session/cookies,
// so Row Level Security applies automatically — this route can
// only ever see the logged-in student's own data).
// ---------------------------------------------------------------
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qijdyaorbvbvuumzdxdu.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jRJUeUmDJ9CMONA75QCCCQ_2aCizXnE";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // In Server Components / certain API routes cookies may be read-only
        }
      },
    },
  });
}

// ---------------------------------------------------------------
// Build a short, useful summary of the student's tracker data.
// Kept compact on purpose — the AI needs the shape of where the
// student stands, not every row in the database.
// ---------------------------------------------------------------
async function buildStudentContext(supabase: any, studentId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, class_id")
    .eq("id", studentId)
    .single();

  const { data: settings } = await supabase
    .from("student_study_settings")
    .select("daily_hours, target_date")
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: subjects } = await supabase
    .from("subject")
    .select("id, name, priority_weight")
    .eq("class_id", profile?.class_id ?? -1);

  const subjectIds = (subjects ?? []).map((s: any) => s.id);
  const subjectNameById = new Map((subjects ?? []).map((s: any) => [s.id, s.name]));

  const { data: chapters } = subjectIds.length
    ? await supabase
        .from("chapters")
        .select("id, name, subject_id, est_hours")
        .in("subject_id", subjectIds)
    : { data: [] };

  const { data: progress } = await supabase
    .from("student_chapter_progress")
    .select("chapter_id, is_done")
    .eq("student_id", studentId);

  const doneIds = new Set(
    (progress ?? []).filter((p: any) => p.is_done).map((p: any) => p.chapter_id)
  );

  const allChapters = chapters ?? [];
  const doneCount = allChapters.filter((c: any) => doneIds.has(c.id)).length;
  const remaining = allChapters.filter((c: any) => !doneIds.has(c.id));

  // group remaining chapters by subject name for a readable summary
  const remainingBySubject: Record<string, string[]> = {};
  for (const c of remaining) {
    const subjName = subjectNameById.get(c.subject_id) ?? "Unknown";
    if (!remainingBySubject[subjName]) remainingBySubject[subjName] = [];
    remainingBySubject[subjName].push(c.name);
  }
  const remainingSummary = Object.entries(remainingBySubject)
    .map(([subj, chs]) => `- ${subj} (${chs.length} left): ${chs.slice(0, 6).join(", ")}${chs.length > 6 ? ", ..." : ""}`)
    .join("\n");

  const { data: todayPlan } = await supabase
    .from("study_plan_items")
    .select("chapter_id, planned_hours, chapters(name, subject_id)")
    .eq("student_id", studentId)
    .eq("plan_date", today);

  const todaySummary = (todayPlan ?? [])
    .map((p: any) => `${p.chapters?.name ?? "chapter"} (${p.planned_hours}h)`)
    .join(", ") || "No plan generated yet for today.";

  const { data: recentLogs } = await supabase
    .from("daily_study_logs")
    .select("log_date, hours_logged, note")
    .eq("student_id", studentId)
    .order("log_date", { ascending: false })
    .limit(5);

  const logsSummary = (recentLogs ?? [])
    .map((l: any) => `${l.log_date}: ${l.hours_logged}h${l.note ? " — " + l.note : ""}`)
    .join("\n") || "No logs yet.";

  return `
Student: ${profile?.name ?? "Unknown"}
Daily study time available: ${settings?.daily_hours ?? "not set"} hours/day
Target date: ${settings?.target_date ?? "not set"}
Overall progress: ${doneCount}/${allChapters.length} chapters completed

Remaining chapters by subject:
${remainingSummary || "All chapters complete!"}

Today's planned chapters: ${todaySummary}

Recent daily logs (most recent first):
${logsSummary}
`.trim();
}

// ---------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------
class ProviderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nStudent's question: ${userMessage}` }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new ProviderError(`Gemini error ${res.status}`, res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError("Gemini returned no text", 502);
  return text;
}

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    throw new ProviderError(`Groq error ${res.status}`, res.status);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError("Groq returned no text", 502);
  return text;
}

// Tries Gemini first; on ANY failure (quota, rate limit, outage),
// falls back to Groq automatically. The student just gets an answer.
async function callAIWithFallback(systemPrompt: string, userMessage: string) {
  try {
    const text = await callGemini(systemPrompt, userMessage);
    return { text, provider: "gemini" as const };
  } catch (geminiErr) {
    console.warn("[ai-tutor] Gemini failed, falling back to Groq:", geminiErr);
    const text = await callGroq(systemPrompt, userMessage);
    return { text, provider: "groq" as const };
  }
}

// ---------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const message = body?.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    let user = null;
    let context = "Student is browsing as guest (not logged in yet). Answer their question thoroughly, and encourage them to log in to StudyHub if they want personalized revision advice based on their tracked chapters.";

    try {
      const supabase = await getSupabaseServerClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;

      if (user) {
        context = await buildStudentContext(supabase, user.id);
      }
    } catch (err) {
      console.warn("[ai-tutor] auth/context note:", err);
    }

    const systemPrompt = `You are SparkAI, an intelligent, friendly, and encouraging CBSE Class 10 study coach for StudyHub 2.0 preparing students for board exams.

Use the student's real progress data below to give specific, actionable advice — which chapters to prioritise, how to pace themselves given their daily hours and target date, and how to catch up if they're behind schedule.

When the student asks about a topic (Math, Science, etc.), explain it clearly, step by step, at Class 10 level. For problems, walk through the solution steps rather than only giving the final answer.

Keep replies concise and practical. Default to English. However, always reply in the SAME language the student's most recent message is written in — if they write in Hindi, reply in Hindi; if they write in Hinglish, reply in Hinglish; if they write in English, reply in English; and so on for any other language. Never mix in a different language than what they used unless they switch first.

If — and only if — the student asks something like "who is Ansh Yadav", "who made this website", "who is the founder", or similar, answer with enthusiasm using this bio (don't bring it up unprompted otherwise):
Ansh Yadav is the founder and creator of this platform. Remarkably, he built the entire thing while still a Class 10 student himself — designing the study tracker, the chapter system, and this very AI tutor from scratch, driven by a mission to help fellow students study smarter and score higher in their boards. It's a rare example of a student building the tool he wished existed, for thousands of students like him.

STUDENT DATA:
${context}`;

    const { text, provider } = await callAIWithFallback(systemPrompt, message);
    return NextResponse.json({ reply: text, provider });
  } catch (err: any) {
    console.error("[ai-tutor] request failed:", err);
    const msg =
      err?.message ||
      "AI tutor is temporarily unavailable. Please verify API keys or try again in a moment.";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
