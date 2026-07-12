import partyUiCopy from "@/content/party-ui.json" with { type: "json" };
import type { Locale } from "@/lib/i18n/routing";

export type PartyUiCopy = (typeof partyUiCopy)["en"];

export function getPartyUiCopy(locale: Locale): PartyUiCopy {
  return partyUiCopy[locale];
}
