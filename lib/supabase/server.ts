import { createClient } from "@supabase/supabase-js";

import { getSupabaseRuntimeEnv } from "./env";

export function createSupabaseServiceClient() {
  const env = getSupabaseRuntimeEnv();

  if (!env) {
    throw new Error("Supabase runtime environment is not configured.");
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
