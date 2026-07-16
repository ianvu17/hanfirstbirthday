import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseParticipantCookieValue,
  updateParticipantPhotoAvatar,
  updateParticipantPresetAvatar
} from "@/lib/party-remote/repository";
import { isAvatarPresetId } from "@/lib/party-avatar";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const maxPreparedAvatarBytes = 524288;
const presetSchema = z.object({
  type: z.literal("preset"),
  presetId: z.string()
});

function readUint32Be(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function readUint16Be(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function parsePngDimensions(bytes: Uint8Array) {
  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (!pngMagic.every((value, index) => bytes[index] === value)) {
    return null;
  }

  return {
    mimeType: "image/png" as const,
    width: readUint32Be(bytes, 16),
    height: readUint32Be(bytes, 20)
  };
}

function parseWebpDimensions(bytes: Uint8Array) {
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));

  if (riff !== "RIFF" || webp !== "WEBP") {
    return null;
  }

  const chunk = String.fromCharCode(...bytes.slice(12, 16));

  if (chunk === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { mimeType: "image/webp" as const, width, height };
  }

  if (chunk === "VP8 " && bytes.length >= 30) {
    const width = bytes[26] | ((bytes[27] & 0x3f) << 8);
    const height = bytes[28] | ((bytes[29] & 0x3f) << 8);
    return { mimeType: "image/webp" as const, width, height };
  }

  if (chunk === "VP8L" && bytes.length >= 25) {
    const bits =
      bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { mimeType: "image/webp" as const, width, height };
  }

  return null;
}

function parseJpegDimensions(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    const marker = bytes[offset + 1];
    const length = readUint16Be(bytes, offset + 2);

    if (length < 2) {
      return null;
    }

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        mimeType: "image/jpeg" as const,
        height: readUint16Be(bytes, offset + 5),
        width: readUint16Be(bytes, offset + 7)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function inspectPreparedImage(bytes: Uint8Array) {
  return (
    parseWebpDimensions(bytes) ??
    parseJpegDimensions(bytes) ??
    parsePngDimensions(bytes)
  );
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
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
    const type = formData.get("type");
    const file = formData.get("file");

    if (type !== "photo" || !(file instanceof File)) {
      return errorResponse("invalid_avatar", "Please send a prepared avatar image.", 400);
    }

    if (file.size <= 0 || file.size > maxPreparedAvatarBytes) {
      return errorResponse("invalid_avatar", "Avatar image is too large.", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = inspectPreparedImage(bytes);

    if (!image) {
      return errorResponse("invalid_avatar", "Avatar image could not be validated.", 400);
    }

    if (image.mimeType === "image/png") {
      return errorResponse("invalid_avatar", "Please upload the prepared WebP or JPEG avatar.", 400);
    }

    if (image.width !== 512 || image.height !== 512) {
      return errorResponse("invalid_avatar", "Avatar image must be 512 by 512 pixels.", 400);
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
