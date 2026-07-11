import "server-only";

import enContent from "@/content/en.json";
import viContent from "@/content/vi.json";
import { ContentSchema, type BirthdayContent } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/routing";

const contentByLocale = {
  en: enContent,
  vi: viContent
} satisfies Record<Locale, unknown>;

export async function getContent(locale: Locale): Promise<BirthdayContent> {
  return ContentSchema.parse(contentByLocale[locale]);
}

export function getOptionalCopy(value: string, fallback: string): string {
  return value.trim().length > 0 ? value : fallback;
}
