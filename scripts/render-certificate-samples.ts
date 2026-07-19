import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";

import { generateWinnerCertificatePdf } from "@/lib/party-certificate/pdf";
import type { WinnerCertificateContext } from "@/lib/party-remote/repository";

const output = "output/pdf";

function sample(
  participantId: string,
  patch: Partial<WinnerCertificateContext>,
): WinnerCertificateContext {
  return {
    sessionId: `visual-${participantId}`,
    participantId,
    displayName: "IAN",
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

async function main() {
  const photoBytes = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 117, g: 185, b: 214, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="512" height="512"><circle cx="256" cy="210" r="100" fill="#fff9e9"/><path d="M120 500c20-145 252-145 272 0" fill="#f7c94d"/></svg>',
        ),
      },
    ])
    .png()
    .toBuffer();
  const samples: Array<[string, WinnerCertificateContext]> = [
    [
      "certificate-en-photo.pdf",
      sample("winner-en-photo", {
        displayName: "IAN",
        avatar: { type: "photo", bytes: photoBytes, mimeType: "image/png" },
      }),
    ],
    [
      "certificate-vi-preset.pdf",
      sample("winner-vi-preset", {
        locale: "vi",
        displayName: "NGUYỄN THỊ MINH ANH",
        score: 9_180,
        correctAnswers: 9,
        eventDate: null,
        avatar: { type: "preset", presetId: "birthday-bunny" },
      }),
    ],
    [
      "certificate-en-initials.pdf",
      sample("winner-en-initials", {
        displayName: "Alex Morgan",
        avatar: { type: "fallback", initials: "AM" },
      }),
    ],
    [
      "certificate-vi-long-name.pdf",
      sample("winner-vi-long", {
        locale: "vi",
        displayName: "NGUYỄN THỊ MINH ANH VŨ TRẦN PHƯƠNG",
        eventDate: null,
        avatar: { type: "fallback", initials: "NA" },
      }),
    ],
    [
      "certificate-en-five-digit-score.pdf",
      sample("winner-five-digits", { score: 18_750, correctAnswers: 10 }),
    ],
    [
      "certificate-en-three-questions.pdf",
      sample("winner-three", { score: 5_640, correctAnswers: 3, totalQuestions: 3 }),
    ],
    [
      "certificate-en-ten-questions.pdf",
      sample("winner-ten", { score: 16_420, correctAnswers: 10, totalQuestions: 10 }),
    ],
  ];

  await mkdir(output, { recursive: true });
  for (const [fileName, context] of samples) {
    await writeFile(
      `${output}/${fileName}`,
      await generateWinnerCertificatePdf(context),
    );
  }
}

void main();
