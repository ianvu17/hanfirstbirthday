import createMiddleware from "next-intl/middleware";

import { routing } from "@/lib/i18n/routing";

const intlProxy = createMiddleware(routing);

export default intlProxy;

export const config = {
  matcher: [
    "/",
    "/(en|vi)/:path*",
    "/((?!api|_next|_vercel|display|.*\\..*).*)"
  ]
};
