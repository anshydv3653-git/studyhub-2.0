# StudyHub 2.0 & Spark AI by Ansh — Technical Architecture

## 1. Personal Study Tracker
- Built on Supabase:
  - `student_study_settings` (daily study goal, optional target date)
  - `student_subjects` (custom subjects created by students with color and weekly targets)
  - `student_tasks` (subject-specific tasks with instant ticking)
  - `study_sessions` (logged study minutes and notes)
  - RPC `study_tracker_overview()` for fast consolidated overview.

## 2. Spark AI by Ansh
- Direct streaming from Supabase Edge Function `spark-ai-chat`
- Multi-model: Gemini 2.5 Flash and GPT-OSS 120B
- Multi-modal attachment uploads (Images & PDF up to 4MB)
- No AI keys exposed on the client.
