import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  certificateFileName,
  generateWinnerCertificatePdf,
} from "@/lib/party-certificate/pdf";
import { verifyHostSessionCookie } from "@/lib/party-remote/host-auth";
import { loadHostWinnerCertificateContext } from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Certificate service is not configured.",
        },
      },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();

  if (!verifyHostSessionCookie(cookieStore.get("han_host_session")?.value)) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again.",
        },
      },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  try {
    const result = await loadHostWinnerCertificateContext();

    if (!result.ok) {
      const messages = {
        unauthenticated: "Please unlock the host controller again.",
        quiz_not_finished:
          "The winner certificate is available after the quiz finishes.",
        not_winner:
          "The winner certificate is available only for the first-place winner.",
        no_winner: "The winner certificate could not find a winner yet.",
      } as const;

      return NextResponse.json(
        { error: { code: result.error, message: messages[result.error] } },
        {
          status: result.status,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const pdfBytes = await generateWinnerCertificatePdf(result.context);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificateFileName(result.context.displayName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("host_certificate_generation_failed", {
      reason: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: "The certificate could not be prepared yet.",
        },
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
