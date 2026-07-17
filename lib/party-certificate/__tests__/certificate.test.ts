import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

import { certificateFileName, generateWinnerCertificatePdf } from "../pdf";
import type { WinnerCertificateContext } from "@/lib/party-remote/repository";

function context(
  patch: Partial<WinnerCertificateContext> = {},
): WinnerCertificateContext {
  return {
    sessionId: "session-1",
    participantId: "winner-1",
    displayName: "Ian",
    locale: "en",
    score: 8_420,
    correctAnswers: 8,
    rank: 1,
    totalQuestions: 10,
    eventDate: "Configured event date",
    avatar: { type: "fallback", initials: "I" },
    ...patch,
  };
}

test("certificate filename is safe and stable", () => {
  assert.equal(
    certificateFileName("  Nguyễn / Ian?!  "),
    "han-mastermind-nguyen-ian.pdf",
  );
  assert.equal(certificateFileName("***"), "han-mastermind-winner.pdf");
});

test("English, Vietnamese, photo, preset, fallback, and long-name certificates are one A4 landscape page", async () => {
  const photoBytes = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 117, g: 185, b: 214, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const cases = [
    context(),
    context({
      locale: "vi",
      displayName: "Nguyễn Thị Minh Anh",
      avatar: { type: "preset", presetId: "birthday-bunny" },
      eventDate: null,
    }),
    context({
      displayName:
        "Alexandra Nguyễn-Vũ With An Exceptionally Long Celebration Name",
    }),
    context({
      displayName: "Photo Winner",
      avatar: { type: "photo", bytes: photoBytes, mimeType: "image/png" },
    }),
  ];

  for (const item of cases) {
    const bytes = await generateWinnerCertificatePdf(item);
    const pdf = await PDFDocument.load(bytes);
    const [page] = pdf.getPages();
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(Math.abs(page.getWidth() - 841.89) < 0.1);
    assert.ok(Math.abs(page.getHeight() - 595.28) < 0.1);
    assert.ok(bytes.byteLength > 5_000);
    assert.ok(bytes.byteLength < 2_000_000);
  }
});

test("certificate endpoint derives identity server-side and sets private download headers", () => {
  const route = readFileSync("app/api/party/certificate/route.ts", "utf8");
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");

  assert.equal(route.includes("request.url"), false);
  assert.equal(route.includes("searchParams"), false);
  assert.equal(
    route.includes('cookieStore.get("han_participant_session")'),
    true,
  );
  assert.equal(route.includes('"Content-Type": "application/pdf"'), true);
  assert.equal(route.includes('"Cache-Control": "private, no-store"'), true);
  assert.equal(
    repository.includes('sessionResult.data.phase !== "finished"'),
    true,
  );
  assert.equal(repository.includes("winner.guestId !== participant.id"), true);
  assert.equal(repository.includes("download(participant.avatar_path)"), true);
});

test("certificate uses persisted points and the configured question denominator", async () => {
  const source = readFileSync("lib/party-certificate/pdf.ts", "utf8");
  const bytes = await generateWinnerCertificatePdf(
    context({ score: 5_640, correctAnswers: 3, totalQuestions: 3 }),
  );
  const pdf = await PDFDocument.load(bytes);

  assert.equal(pdf.getPageCount(), 1);
  assert.ok(bytes.byteLength > 5_000);
  assert.equal(
    source.includes("formatPoints(context.score, context.locale)"),
    true,
  );
  assert.equal(source.includes("context.correctAnswers"), true);
  assert.equal(source.includes("context.totalQuestions"), true);
});
