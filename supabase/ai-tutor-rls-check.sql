-- =============================================================
-- StudyHub 2.0 — AI Tutor: RLS check (OPTIONAL)
-- =============================================================
-- The 4 tables below already exist in your Supabase database
-- (verified: student_study_settings, student_chapter_progress,
--  study_plan_items, daily_study_logs).
--
-- Run this file in the Supabase SQL Editor ONLY IF those tables
-- don't already have Row Level Security policies. If your tables
-- were created with policies already, skip this file entirely.
--
-- Effect: each logged-in student can read/write ONLY their own
-- rows — a student can never see another student's data.
-- =============================================================

-- 1) student_study_settings
alter table public.student_study_settings enable row level security;
drop policy if exists "students manage own study settings" on public.student_study_settings;
create policy "students manage own study settings"
  on public.student_study_settings for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- 2) student_chapter_progress
alter table public.student_chapter_progress enable row level security;
drop policy if exists "students manage own chapter progress" on public.student_chapter_progress;
create policy "students manage own chapter progress"
  on public.student_chapter_progress for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- 3) study_plan_items
alter table public.study_plan_items enable row level security;
drop policy if exists "students manage own study plans" on public.study_plan_items;
create policy "students manage own study plans"
  on public.study_plan_items for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- 4) daily_study_logs
alter table public.daily_study_logs enable row level security;
drop policy if exists "students manage own study logs" on public.daily_study_logs;
create policy "students manage own study logs"
  on public.daily_study_logs for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
