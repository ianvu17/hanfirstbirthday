import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  isHostAuthConfigured,
  verifyHostSessionCookie
} from "@/lib/party-remote/host-auth";

export async function GET() {
  const cookieStore = await cookies();
  const authorized = verifyHostSessionCookie(cookieStore.get("han_host_session")?.value);

  return NextResponse.json({
    configured: isHostAuthConfigured(),
    authorized
  });
}
