import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseParticipantCookieValue,
  updateParticipantPhotoAvatar,
  updateParticipantPresetAvatar
} from "@/lib/party-remote/repository";
import { isAvatarPresetId } from "@/lib/party-avatar";
import {
  inspectPreparedImage,
  isPreparedAvatarMimeType,
  maxPreparedAvatarBytes,
  preparedAvatarFieldName
} from "@/lib/party-avatar-upload";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

const presetSchema = z.object({
  type: z.literal("preset"),
  presetId: z.string()
});

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function avatarError(code: string, status = 400) {
  switch (code) {
    case "avatar_blob_empty":
      return errorResponse(code, "We could not prepare the photo correctly. Please try again.", status);
    case "avatar_mime_missing":
      return errorResponse(code, "We could not identify the prepared photo format. Please try again.", status);
    case "avatar_mime_unsupported":
      return errorResponse(code, "This prepared photo format is not supported. Please retake it or choose another photo.", status);
    case "avatar_signature_mismatch":
      return errorResponse(code, "The prepared photo format did not match its file data. Please try again.", status);
    case "avatar_decode_failed":
      return errorResponse(code, "We could not read the prepared photo. Please try again.", status);
    case "avatar_upload_failed":
      return errorResponse(code, "We could not save the avatar yet. Please try again.", status);
    default:
      return errorResponse("invalid_avatar", "Please send a prepared avatar image.", status);
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return errorResponse(
      "supabase_not_configured",
      "Supabase is not configured for avatar uploads.",
      503
    );
  }

  try {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const parsed = presetSchema.safeParse(await request.json().catch(() => null));

      if (!parsed.success || !isAvatarPresetId(parsed.data.presetId)) {
        return errorResponse("invalid_avatar", "Please choose one of the birthday avatars.", 400);
      }

      const result = await updateParticipantPresetAvatar(
        participantSession,
        parsed.data.presetId
      );

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        participant: {
          id: result.participant.id,
          displayName: result.participant.display_name,
          locale: result.participant.locale,
          avatar: result.avatar
        },
        snapshot: result.snapshot
      });
    }

    const formData = await request.formData();
    const file = formData.get(preparedAvatarFieldName);

    if (!(file instanceof File)) {
      return errorResponse("invalid_avatar", "Please send a prepared avatar image.", 400);
    }

    if (file.size <= 0) {
      return avatarError("avatar_blob_empty");
    }

    if (file.size > maxPreparedAvatarBytes) {
      return avatarError("avatar_upload_failed", 413);
    }

    if (!file.type) {
      return avatarError("avatar_mime_missing");
    }

    if (!isPreparedAvatarMimeType(file.type)) {
      return avatarError("avatar_mime_unsupported");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = inspectPreparedImage(bytes);

    if (!image.ok) {
      return avatarError(image.reason);
    }

    if (image.mimeType !== file.type) {
      return avatarError(
        image.mimeType === "image/png"
          ? "avatar_mime_unsupported"
          : "avatar_signature_mismatch"
      );
    }

    if (image.width !== 512 || image.height !== 512) {
      return avatarError("avatar_decode_failed");
    }

    const result = await updateParticipantPhotoAvatar(
      participantSession,
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      image.mimeType
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      participant: {
        id: result.participant.id,
        displayName: result.participant.display_name,
        locale: result.participant.locale,
        avatar: result.avatar
      },
      snapshot: result.snapshot
    });
  } catch (error) {
    return errorResponse(
      "temporary_server_failure",
      error instanceof Error ? error.message : "Could not save the avatar.",
      500
    );
  }
}
