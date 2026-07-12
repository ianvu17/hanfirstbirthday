export type SupabaseRuntimeEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export function getPublicAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export function getSupabaseRuntimeEnv(): SupabaseRuntimeEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    anonKey,
    serviceRoleKey
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseRuntimeEnv());
}

export function getDefaultPartyJoinCode() {
  return process.env.PARTY_JOIN_CODE?.trim() || "han-turns-one";
}

export function isDefaultPartyTestMode() {
  if (process.env.PARTY_SESSION_IS_TEST) {
    return process.env.PARTY_SESSION_IS_TEST === "true";
  }

  return process.env.NODE_ENV !== "production";
}
