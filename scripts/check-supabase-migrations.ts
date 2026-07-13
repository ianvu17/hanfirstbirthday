import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const sql = migrationFiles
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n\n");

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
  "question_responses_leaderboard_idx",
  "party_sessions_one_current_context_idx",
  "party_sessions_create_idempotency_unique_idx",
  "create or replace function public.create_party_session",
  "create or replace function public.archive_party_session",
  "grant execute on function public.create_party_session",
  "grant execute on function public.archive_party_session",
  "Public can read active party session wakeups",
  "Public can read active participant wakeups",
  "grant select (",
  "grant execute on function public.touch_party_session_response(uuid) to service_role",
  "alter publication supabase_realtime add table public.party_sessions",
  "alter publication supabase_realtime add table public.participants"
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
