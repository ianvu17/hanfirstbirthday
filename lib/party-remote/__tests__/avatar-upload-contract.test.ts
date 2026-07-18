import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getPreparedAvatarFileName,
  inspectPreparedImage,
  isPreparedAvatarMimeType,
  preparedAvatarFieldName
} from "@/lib/party-avatar-upload";

function webpVp8x(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x16, 0x00, 0x00, 0x00], 4);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  bytes[24] = (width - 1) & 0xff;
  bytes[25] = ((width - 1) >> 8) & 0xff;
  bytes[26] = ((width - 1) >> 16) & 0xff;
  bytes[27] = (height - 1) & 0xff;
  bytes[28] = ((height - 1) >> 8) & 0xff;
  bytes[29] = ((height - 1) >> 16) & 0xff;
  return bytes;
}

function jpegSof(width: number, height: number) {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00
  ]);
}

function png(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[16] = (width >> 24) & 0xff;
  bytes[17] = (width >> 16) & 0xff;
  bytes[18] = (width >> 8) & 0xff;
  bytes[19] = width & 0xff;
  bytes[20] = (height >> 24) & 0xff;
  bytes[21] = (height >> 16) & 0xff;
  bytes[22] = (height >> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

test("prepared avatar upload contract uses avatar field and matching WebP/JPEG filenames", () => {
  assert.equal(preparedAvatarFieldName, "avatar");
  assert.equal(getPreparedAvatarFileName("image/webp"), "avatar.webp");
  assert.equal(getPreparedAvatarFileName("image/jpeg"), "avatar.jpg");
  assert.equal(isPreparedAvatarMimeType("image/webp"), true);
  assert.equal(isPreparedAvatarMimeType("image/jpeg"), true);
  assert.equal(isPreparedAvatarMimeType("image/png"), false);
  assert.equal(isPreparedAvatarMimeType(""), false);
});

test("prepared avatar signature inspection identifies WebP, JPEG, PNG, and decode failures", () => {
  assert.deepEqual(inspectPreparedImage(webpVp8x(512, 512)), {
    ok: true,
    mimeType: "image/webp",
    width: 512,
    height: 512
  });
  assert.deepEqual(inspectPreparedImage(jpegSof(512, 512)), {
    ok: true,
    mimeType: "image/jpeg",
    width: 512,
    height: 512
  });
  assert.deepEqual(inspectPreparedImage(png(512, 512)), {
    ok: true,
    mimeType: "image/png",
    width: 512,
    height: 512
  });
  assert.deepEqual(inspectPreparedImage(new Uint8Array([1, 2, 3, 4])), {
    ok: false,
    reason: "avatar_decode_failed"
  });
});

test("client submits a File through progress-aware multipart XHR without manually setting content type", () => {
  const uploadClient = readFileSync("lib/party-avatar-upload-client.ts", "utf8");
  const partyPhoto = readFileSync("components/guest/party-photo-card.tsx", "utf8");

  assert.equal(uploadClient.includes("formData.append(preparedAvatarFieldName, file);"), true);
  assert.equal(uploadClient.includes("xhr.withCredentials = true"), true);
  assert.equal(uploadClient.includes('setRequestHeader("content-type"'), false);
  assert.equal(uploadClient.includes("xhr.upload.onprogress"), true);
  assert.equal(uploadClient.includes("xhr.abort()"), true);
  assert.equal(partyPhoto.includes("new File([preferred], getPreparedAvatarFileName(preferred.type)"), true);
  assert.equal(partyPhoto.includes("new File([fallback], getPreparedAvatarFileName(fallback.type)"), true);
});

test("avatar route validates declared MIME, signature, and avatar field in Node runtime", () => {
  const route = readFileSync("app/api/party/participant/avatar/route.ts", "utf8");

  assert.equal(route.includes('export const runtime = "nodejs";'), true);
  assert.equal(route.includes("formData.get(preparedAvatarFieldName)"), true);
  assert.equal(route.includes('formData.get("file")'), false);
  assert.equal(route.includes("avatar_blob_empty"), true);
  assert.equal(route.includes("avatar_mime_missing"), true);
  assert.equal(route.includes("avatar_mime_unsupported"), true);
  assert.equal(route.includes("avatar_signature_mismatch"), true);
  assert.equal(route.includes("avatar_decode_failed"), true);
});

test("final avatar rendering calls sticker artwork only, while editor controls remain JSX/CSS only", () => {
  const partyPhoto = readFileSync("components/guest/party-photo-card.tsx", "utf8");
  const renderStart = partyPhoto.indexOf("function renderFinalAvatar");
  const exportStart = partyPhoto.indexOf("async function canvasToBlob");
  const finalRenderer = partyPhoto.slice(renderStart, exportStart);

  assert.notEqual(renderStart, -1);
  assert.equal(finalRenderer.includes("drawStickerArtwork"), true);
  assert.equal(finalRenderer.includes("ring-"), false);
  assert.equal(finalRenderer.includes("border-party-blue"), false);
  assert.equal(finalRenderer.includes("setSelectedStickerId"), false);
});
