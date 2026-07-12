import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createHostSessionCookieValue,
  getHostCookieOptions,
  isHostAuthConfigured,
  verifyHostPin
} from "@/lib/party-remote/host-auth";

const loginSchema = z.object({
  pin: z.string().min(1).max(80)
});

export async function POST(request: Request) {
  if (!isHostAuthConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Host PIN is not configured."
        }
      },
      { status: 503 }
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !verifyHostPin(parsed.data.pin)) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "That PIN did not work."
        }
      },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "han_host_session",
    createHostSessionCookieValue(),
    getHostCookieOptions()
  );

  return NextResponse.json({ ok: true });
}
