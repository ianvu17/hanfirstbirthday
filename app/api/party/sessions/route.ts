import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyHostSessionCookie } from "@/lib/party-remote/host-auth";
import {
  archivePartySession,
  buildRemotePartySnapshot,
  createPartySession,
  listSessionHistory
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const createSchema = z.object({
  action: z.literal("create"),
  idempotencyKey: z.string().min(8).max(160),
  label: z.string().trim().max(80).optional(),
  archiveExisting: z.boolean().optional()
});

const archiveSchema = z.object({
  action: z.literal("archive"),
  sessionId: z.string().uuid()
});

const mutationSchema = z.discriminatedUnion("action", [createSchema, archiveSchema]);

async function requireHost() {
  const cookieStore = await cookies();
  return verifyHostSessionCookie(cookieStore.get("han_host_session")?.value);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for party sessions."
        }
      },
      { status: 503 }
    );
  }

  if (!(await requireHost())) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again."
        }
      },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({
      current: await buildRemotePartySnapshot(),
      recentSessions: await listSessionHistory()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not load party sessions."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for party sessions."
        }
      },
      { status: 503 }
    );
  }

  if (!(await requireHost())) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again."
        }
      },
      { status: 401 }
    );
  }

  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_transition",
          message: "That session action is not available."
        }
      },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === "create") {
      await createPartySession(parsed.data.idempotencyKey, {
        label: parsed.data.label,
        archiveExisting: parsed.data.archiveExisting ?? false
      });
    } else {
      await archivePartySession(parsed.data.sessionId);
    }

    return NextResponse.json({
      current: await buildRemotePartySnapshot(),
      recentSessions: await listSessionHistory()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update party sessions.";
    const activeExists = message.includes("active_session_exists");

    return NextResponse.json(
      {
        error: {
          code: activeExists ? "invalid_transition" : "temporary_server_failure",
          message: activeExists
            ? "A current session already exists. Archive it before creating another."
            : message
        }
      },
      { status: activeExists ? 409 : 500 }
    );
  }
}
