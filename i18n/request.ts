import { getRequestConfig } from "next-intl/server";

import { getContent } from "@/lib/content";
import { isLocale, routing, type Locale } from "@/lib/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale: Locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;
  const content = await getContent(locale);

  return {
    locale,
    messages: content
  };
});
