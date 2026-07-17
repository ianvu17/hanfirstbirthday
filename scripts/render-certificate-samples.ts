import { mkdir, writeFile } from "node:fs/promises";

import { generateWinnerCertificatePdf } from "@/lib/party-certificate/pdf";
import type { WinnerCertificateContext } from "@/lib/party-remote/repository";

const output = "tmp/pdfs";

const samples: WinnerCertificateContext[] = [
  {
    sessionId: "visual-en",
    participantId: "winner-en",
    displayName: "IAN",
    locale: "en",
    score: 8_420,
    correctAnswers: 8,
    rank: 1,
    totalQuestions: 10,
    eventDate: "Configured event date",
    avatar: { type: "preset", presetId: "birthday-bear" },
  },
  {
    sessionId: "visual-vi",
    participantId: "winner-vi",
    displayName: "NGUYỄN THỊ MINH ANH",
    locale: "vi",
    score: 9_180,
    correctAnswers: 9,
    rank: 1,
    totalQuestions: 10,
    eventDate: null,
    avatar: { type: "fallback", initials: "NA" },
  },
];

async function main() {
  await mkdir(output, { recursive: true });

  for (const sample of samples) {
    const bytes = await generateWinnerCertificatePdf(sample);
    await writeFile(`${output}/certificate-${sample.locale}.pdf`, bytes);
  }
}

void main();
