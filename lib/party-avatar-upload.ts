export const preparedAvatarFieldName = "avatar";
export const maxPreparedAvatarBytes = 524288;
export const preparedAvatarMimeTypes = ["image/webp", "image/jpeg"] as const;

export type PreparedAvatarMimeType = (typeof preparedAvatarMimeTypes)[number];

export type PreparedImageInspection =
  | {
      ok: true;
      mimeType: "image/webp" | "image/jpeg" | "image/png";
      width: number;
      height: number;
    }
  | {
      ok: false;
      reason: "avatar_decode_failed";
    };

export function isPreparedAvatarMimeType(value: string): value is PreparedAvatarMimeType {
  return preparedAvatarMimeTypes.includes(value as PreparedAvatarMimeType);
}

export function getPreparedAvatarFileName(mimeType: PreparedAvatarMimeType) {
  return mimeType === "image/webp" ? "avatar.webp" : "avatar.jpg";
}

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

export function inspectPreparedImage(bytes: Uint8Array): PreparedImageInspection {
  const image =
    parseWebpDimensions(bytes) ??
    parseJpegDimensions(bytes) ??
    parsePngDimensions(bytes);

  if (!image) {
    return {
      ok: false,
      reason: "avatar_decode_failed"
    };
  }

  return {
    ok: true,
    ...image
  };
}
