import scaffoldCopy from "@/content/scaffold.json";
import type { Locale } from "@/lib/i18n/routing";

export function getScaffoldCopy(locale: Locale) {
  return scaffoldCopy[locale];
}

export function getLocaleLabel(locale: Locale) {
  return scaffoldCopy.localeLabels[locale];
}

export function getDisplayScaffoldCopy() {
  return scaffoldCopy.display;
}
