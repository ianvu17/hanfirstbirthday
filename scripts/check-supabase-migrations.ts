import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/202607120001_milestone5_party_sessions.sql"
);
const sql = readFileSync(migrationPath, "utf8");

const requiredFragments = [
  "create table if not exists public.party_sessions",
  "create table if not exists public.participants",
  "create table if not exists public.question_responses",
  "create table if not exists public.host_command_log",
  "create or replace function public.touch_party_session_response",
  "question_responses_one_per_question_unique unique",
  "alter table public.party_sessions enable row level security",
  "alter table public.participants enable row level security",
  "alter table public.question_responses enable row level security",
  "alter table public.host_command_log enable row level security",
  "No anonymous party session writes",
  "No anonymous participant writes",
  "No anonymous response writes",
  "No anonymous host command writes",
  "party_sessions_one_active_production_idx",
  "question_responses_leaderboard_idx"
];

const missing = requiredFragments.filter((fragment) => !sql.includes(fragment));

if (missing.length > 0) {
  console.error("Supabase migration is missing required fragments:");
  for (const fragment of missing) {
    console.error(`- ${fragment}`);
  }
  process.exit(1);
}

console.log("Supabase migration includes Milestone 5 tables, constraints, indexes, and RLS policies.");
