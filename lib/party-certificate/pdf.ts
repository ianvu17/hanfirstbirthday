import { join } from "node:path";

import PDFDocument from "pdfkit";
import sharp from "sharp";

import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import type { WinnerCertificateContext } from "@/lib/party-remote/repository";

const notoSansRoot = join(process.cwd(), "node_modules", "@expo-google-fonts", "noto-sans");

const palette = {
  cream: "#fff9e9",
  paper: "#fffdf6",
  ink: "#2f4058",
  muted: "#654f40",
  blue: "#75b9d6",
  blueDeep: "#2f7397",
  yellow: "#f7c94d",
  orange: "#f58b5f",
  coral: "#e3514a",
  green: "#59aa7d"
} as const;

const fontFiles = {
  regular: join(notoSansRoot, "400Regular", "NotoSans_400Regular.ttf"),
  bold: join(notoSansRoot, "700Bold", "NotoSans_700Bold.ttf"),
  extraBold: join(notoSansRoot, "800ExtraBold", "NotoSans_800ExtraBold.ttf")
};

function registerFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont("Regular", fontFiles.regular);
  doc.registerFont("Bold", fontFiles.bold);
  doc.registerFont("ExtraBold", fontFiles.extraBold);
}

function fitText(
  doc: PDFKit.PDFDocument,
  text: string,
  font: "Regular" | "Bold" | "ExtraBold",
  preferred: number,
  maxWidth: number,
  minimum: number
) {
  doc.font(font);
  let size = preferred;
  while (size > minimum && doc.fontSize(size).widthOfString(text) > maxWidth) size -= 1;
  return size;
}

function drawBunting(doc: PDFKit.PDFDocument) {
  const colors = [palette.blue, palette.yellow, palette.orange, palette.coral, palette.green];
  doc.moveTo(44, 47).lineTo(798, 47).lineWidth(2).stroke(palette.blueDeep);
  for (let index = 0; index < 15; index += 1) {
    const x = 48 + index * 52;
    doc.polygon([x, 47], [x + 32, 47], [x + 16, 81]).fill(colors[index % colors.length]);
  }
}

function drawGinghamCorners(doc: PDFKit.PDFDocument) {
  const size = 12;
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const color = (row + column) % 2 === 0 ? palette.yellow : palette.paper;
      doc.rect(28 + column * size, 505 + row * size, size, size).fill(color);
      doc.rect(730 + column * size, 505 + row * size, size, size).fill(color);
    }
  }
}

function drawConfetti(doc: PDFKit.PDFDocument) {
  const pieces = [
    [78, 125, palette.orange, -8],
    [120, 83, palette.blue, -20],
    [735, 110, palette.coral, -4],
    [770, 150, palette.yellow, -28],
    [96, 410, palette.green, -14],
    [748, 408, palette.blue, -22]
  ] as const;
  for (const [x, y, color, angle] of pieces) {
    doc.save().rotate(angle, { origin: [x, y] }).rect(x, y, 7, 18).fill(color).restore();
  }
  doc.circle(150, 130, 7).fill(palette.yellow);
  doc.circle(700, 90, 8).fill(palette.orange);
}

async function preparedPhoto(bytes: Uint8Array) {
  return sharp(bytes).resize(512, 512, { fit: "cover", position: "centre" }).png().toBuffer();
}

function drawAvatar(
  doc: PDFKit.PDFDocument,
  context: WinnerCertificateContext,
  photo: Buffer | null
) {
  const x = 91;
  const y = 234;
  const size = 128;
  doc.circle(x + size / 2 + 5, y + size / 2 + 6, size / 2 + 8).fill(palette.blue);
  doc.circle(x + size / 2, y + size / 2, size / 2 + 8).fillAndStroke(palette.paper, palette.blueDeep);
  doc.lineWidth(3).circle(x + size / 2, y + size / 2, size / 2 + 8).stroke(palette.blueDeep);

  if (photo) {
    doc.save().circle(x + size / 2, y + size / 2, size / 2).clip();
    doc.image(photo, x, y, { width: size, height: size });
    doc.restore();
    return;
  }

  doc.circle(x + size / 2, y + size / 2, size / 2).fill(palette.cream);
  if (context.avatar.type === "preset") {
    doc.circle(x + 64, y + 68, 44).fill(palette.yellow);
    doc.circle(x + 48, y + 60, 5).fill(palette.ink);
    doc.circle(x + 80, y + 60, 5).fill(palette.ink);
    doc.moveTo(x + 54, y + 84).lineTo(x + 74, y + 84).lineWidth(4).stroke(palette.coral);
    doc.polygon([x + 64, y + 17], [x + 90, y + 75], [x + 38, y + 75]).fillAndStroke(palette.blue, palette.paper);
    return;
  }

  const initials = context.avatar.type === "fallback" ? context.avatar.initials : "?";
  const sizeText = fitText(doc, initials, "ExtraBold", 44, 92, 28);
  doc.font("ExtraBold").fontSize(sizeText).fillColor(palette.blueDeep).text(initials, x, y + 42, {
    width: size,
    align: "center"
  });
}

export function certificateFileName(displayName: string) {
  const safe = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "winner";
  return `han-mastermind-${safe}.pdf`;
}

export async function generateWinnerCertificatePdf(context: WinnerCertificateContext) {
  const copy = getPartyUiCopy(context.locale);
  const photo = context.avatar.type === "photo"
    ? await preparedPhoto(context.avatar.bytes).catch(() => null)
    : null;
  const eventLine = context.eventDate ?? copy.certificateEventFallback;
  const title = copy.mastermindTitle.toLocaleUpperCase(context.locale);
  const upperName = context.displayName.toLocaleUpperCase(context.locale);

  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `${copy.mastermindTitle} - ${context.displayName}`,
        Author: "Han First Birthday",
        Subject: copy.mastermindCelebration,
        Creator: "Han Birthday Experience"
      }
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    registerFonts(doc);

    doc.rect(0, 0, 841.89, 595.28).fill(palette.cream);
    doc.rect(19, 19, 804, 557).fillAndStroke(palette.paper, palette.blueDeep);
    doc.lineWidth(3).rect(19, 19, 804, 557).stroke(palette.blueDeep);
    doc.lineWidth(2).rect(28, 28, 786, 539).stroke(palette.yellow);
    drawBunting(doc);
    drawGinghamCorners(doc);
    drawConfetti(doc);

    doc.font("Bold").fontSize(12).fillColor(palette.coral).text("HAN FIRST BIRTHDAY", 0, 86, {
      width: 841.89,
      align: "center"
    });
    const titleSize = fitText(doc, title, "ExtraBold", 34, 650, 24);
    doc.font("ExtraBold").fontSize(titleSize).fillColor(palette.blueDeep).text(title, 95, 112, {
      width: 652,
      align: "center"
    });
    doc.font("Regular").fontSize(13).fillColor(palette.muted).text(copy.certificatePresentedTo, 120, 159, {
      width: 602,
      align: "center"
    });

    drawAvatar(doc, context, photo);

    const nameSize = fitText(doc, upperName, "ExtraBold", 42, 530, 24);
    doc.font("ExtraBold").fontSize(nameSize).fillColor(palette.ink).text(upperName, 254, 226, {
      width: 530
    });
    doc.moveTo(254, 281).lineTo(770, 281).lineWidth(2).stroke(palette.yellow);

    const achievementSize = fitText(doc, copy.certificateAchievement, "Regular", 15, 520, 11);
    doc.font("Regular").fontSize(achievementSize).fillColor(palette.muted).text(copy.certificateAchievement, 254, 305, {
      width: 520
    });
    const earnedTitleSize = fitText(doc, title, "ExtraBold", 26, 490, 18);
    doc.font("ExtraBold").fontSize(earnedTitleSize).fillColor(palette.coral).text(title, 254, 342, {
      width: 490
    });

    doc.rect(252, 393, 236, 50).fillAndStroke(palette.cream, palette.orange);
    doc.font("ExtraBold").fontSize(16).fillColor(palette.ink).text(copy.certificateFirstPlace, 270, 402);
    doc.font("Bold").fontSize(11).fillColor(palette.blueDeep).text(`${copy.certificateScore}: ${context.score}/${context.totalQuestions}`, 270, 425);

    doc.circle(691, 418, 39).fillAndStroke(palette.yellow, palette.orange);
    doc.lineWidth(2).circle(691, 418, 30).stroke(palette.paper);
    const sealSize = fitText(doc, copy.certificateSeal, "ExtraBold", 13, 52, 9);
    doc.font("ExtraBold").fontSize(sealSize).fillColor(palette.ink).text(copy.certificateSeal, 665, 411, {
      width: 52,
      align: "center"
    });

    doc.font("Bold").fontSize(11).fillColor(palette.blueDeep).text(eventLine, 252, 476, {
      width: 300
    });
    doc.moveTo(560, 480).lineTo(760, 480).lineWidth(1).stroke(palette.muted);
    doc.font("Regular").fontSize(10).fillColor(palette.muted).text(copy.certificateSignature, 560, 492, {
      width: 200,
      align: "center"
    });

    doc.end();
  });
}
