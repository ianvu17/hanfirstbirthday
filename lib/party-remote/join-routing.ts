import type { Locale } from "@/lib/i18n/routing";

export const joinQueryParam = "join";

export function normalizeJoinCode(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw?.trim();

  return normalized || undefined;
}

function buildLocalizedGuestPath(locale: Locale, path: "" | "/play", joinCode?: string) {
  const params = new URLSearchParams();

  if (joinCode) {
    params.set(joinQueryParam, joinCode);
  }

  const query = params.toString();

  return `/${locale}${path}${query ? `?${query}` : ""}`;
}

export function buildGuestWelcomePath(locale: Locale, joinCode?: string) {
  return buildLocalizedGuestPath(locale, "", joinCode);
}

export function buildGuestPlayPath(locale: Locale, joinCode?: string) {
  return buildLocalizedGuestPath(locale, "/play", joinCode);
}
