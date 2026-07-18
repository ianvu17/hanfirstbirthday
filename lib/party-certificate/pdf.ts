import { join } from "node:path";

import PDFDocument from "pdfkit";
import sharp from "sharp";

import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import type { WinnerCertificateContext } from "@/lib/party-remote/repository";
import { formatPoints } from "@/lib/party-engine";

const notoSansRoot = join(
  process.cwd(),
  "node_modules",
  "@expo-google-fonts",
  "noto-sans",
);

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
  green: "#59aa7d",
} as const;

const fontFiles = {
  regular: join(notoSansRoot, "400Regular", "NotoSans_400Regular.ttf"),
  bold: join(notoSansRoot, "700Bold", "NotoSans_700Bold.ttf"),
  extraBold: join(notoSansRoot, "800ExtraBold", "NotoSans_800ExtraBold.ttf"),
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
  minimum: number,
) {
  doc.font(font);
  let size = preferred;
  while (size > minimum && doc.fontSize(size).widthOfString(text) > maxWidth)
    size -= 1;
  return size;
}

function drawBunting(doc: PDFKit.PDFDocument) {
  const colors = [
    palette.blue,
    palette.yellow,
    palette.orange,
    palette.coral,
    palette.green,
  ];
  doc.moveTo(44, 47).lineTo(798, 47).lineWidth(2).stroke(palette.blueDeep);
  for (let index = 0; index < 15; index += 1) {
    const x = 48 + index * 52;
    doc
      .polygon([x, 47], [x + 32, 47], [x + 16, 81])
      .fill(colors[index % colors.length]);
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
    [748, 408, palette.blue, -22],
  ] as const;
  for (const [x, y, color, angle] of pieces) {
    doc
      .save()
      .rotate(angle, { origin: [x, y] })
      .rect(x, y, 7, 18)
      .fill(color)
      .restore();
  }
  doc.circle(150, 130, 7).fill(palette.yellow);
  doc.circle(700, 90, 8).fill(palette.orange);
}

function drawBackgroundStars(doc: PDFKit.PDFDocument) {
  const stars = [
    [246, 197, 4],
    [300, 184, 3],
    [568, 198, 4],
    [620, 178, 3],
    [231, 467, 3],
    [520, 470, 4],
  ] as const;

  doc.save().fillOpacity(0.13);
  for (const [x, y, radius] of stars) {
    const points: Array<[number, number]> = [];
    for (let index = 0; index < 10; index += 1) {
      const pointRadius = index % 2 === 0 ? radius : radius * 0.42;
      const angle = -Math.PI / 2 + (index * Math.PI) / 5;
      points.push([
        x + Math.cos(angle) * pointRadius,
        y + Math.sin(angle) * pointRadius,
      ]);
    }
    doc.polygon(...points).fill(indexedStarColor(x));
  }
  doc.restore();
}

function indexedStarColor(x: number) {
  return x % 2 === 0 ? palette.blue : palette.yellow;
}

function sealEdgePoints(cx: number, cy: number, outer: number, inner: number) {
  const points: Array<[number, number]> = [];
  for (let index = 0; index < 40; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 40;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

function drawOfficialSeal(
  doc: PDFKit.PDFDocument,
  copy: ReturnType<typeof getPartyUiCopy>,
) {
  const cx = 691;
  const cy = 408;

  doc
    .polygon(
      [cx - 31, cy + 23],
      [cx - 39, cy + 72],
      [cx - 16, cy + 61],
      [cx - 3, cy + 78],
      [cx + 3, cy + 30],
    )
    .fillAndStroke(palette.coral, palette.orange);
  doc
    .polygon(
      [cx + 31, cy + 23],
      [cx + 39, cy + 72],
      [cx + 16, cy + 61],
      [cx + 3, cy + 78],
      [cx - 3, cy + 30],
    )
    .fillAndStroke(palette.yellow, palette.orange);

  doc
    .save()
    .fillOpacity(0.22)
    .polygon(...sealEdgePoints(cx + 4, cy + 5, 51, 45))
    .fill(palette.ink)
    .restore();
  doc
    .polygon(...sealEdgePoints(cx, cy, 51, 45))
    .fillAndStroke(palette.coral, palette.orange);
  doc.lineWidth(2).circle(cx, cy, 40).fillAndStroke(palette.yellow, palette.blueDeep);
  doc.lineWidth(2).circle(cx, cy, 34).fillAndStroke(palette.paper, palette.blueDeep);
  doc.lineWidth(1).circle(cx, cy, 29).stroke(palette.coral);

  const officialSize = fitText(
    doc,
    copy.certificateSealOfficial,
    "ExtraBold",
    7,
    54,
    5,
  );
  doc
    .font("ExtraBold")
    .fontSize(officialSize)
    .fillColor(palette.blueDeep)
    .text(copy.certificateSealOfficial, cx - 28, cy - 23, {
      width: 56,
      align: "center",
    });
  doc
    .font("ExtraBold")
    .fontSize(25)
    .fillColor(palette.coral)
    .text("1", cx - 18, cy - 15, { width: 36, align: "center" });
  const expertSize = fitText(
    doc,
    copy.certificateSealExpert,
    "ExtraBold",
    7,
    52,
    5,
  );
  doc
    .font("ExtraBold")
    .fontSize(expertSize)
    .fillColor(palette.blueDeep)
    .text(copy.certificateSealExpert, cx - 27, cy + 13, {
      width: 54,
      align: "center",
    });
  doc
    .font("Bold")
    .fontSize(5)
    .fillColor(palette.muted)
    .text(copy.certificateSealNumber, cx - 25, cy + 25, {
      width: 50,
      align: "center",
    });
}

async function preparedPhoto(bytes: Uint8Array) {
  return sharp(bytes)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

function drawAvatar(
  doc: PDFKit.PDFDocument,
  context: WinnerCertificateContext,
  photo: Buffer | null,
) {
  const x = 91;
  const y = 234;
  const size = 128;
  doc
    .circle(x + size / 2 + 5, y + size / 2 + 6, size / 2 + 8)
    .fill(palette.blue);
  doc
    .circle(x + size / 2, y + size / 2, size / 2 + 8)
    .fillAndStroke(palette.paper, palette.blueDeep);
  doc
    .lineWidth(3)
    .circle(x + size / 2, y + size / 2, size / 2 + 8)
    .stroke(palette.blueDeep);

  if (photo) {
    doc
      .save()
      .circle(x + size / 2, y + size / 2, size / 2)
      .clip();
    doc.image(photo, x, y, { width: size, height: size });
    doc.restore();
    return;
  }

  doc.circle(x + size / 2, y + size / 2, size / 2).fill(palette.cream);
  if (context.avatar.type === "preset") {
    doc.circle(x + 64, y + 68, 44).fill(palette.yellow);
    doc.circle(x + 48, y + 60, 5).fill(palette.ink);
    doc.circle(x + 80, y + 60, 5).fill(palette.ink);
    doc
      .moveTo(x + 54, y + 84)
      .lineTo(x + 74, y + 84)
      .lineWidth(4)
      .stroke(palette.coral);
    doc
      .polygon([x + 64, y + 17], [x + 90, y + 75], [x + 38, y + 75])
      .fillAndStroke(palette.blue, palette.paper);
    return;
  }

  const initials =
    context.avatar.type === "fallback" ? context.avatar.initials : "?";
  const sizeText = fitText(doc, initials, "ExtraBold", 44, 92, 28);
  doc
    .font("ExtraBold")
    .fontSize(sizeText)
    .fillColor(palette.blueDeep)
    .text(initials, x, y + 42, {
      width: size,
      align: "center",
    });
}

export function certificateFileName(displayName: string) {
  const safe =
    displayName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "winner";
  return `han-mastermind-${safe}.pdf`;
}

export async function generateWinnerCertificatePdf(
  context: WinnerCertificateContext,
) {
  const copy = getPartyUiCopy(context.locale);
  const photo =
    context.avatar.type === "photo"
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
        Creator: "Han Birthday Experience",
      },
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
    drawBackgroundStars(doc);

    doc
      .font("Bold")
      .fontSize(12)
      .fillColor(palette.coral)
      .text("HAN FIRST BIRTHDAY", 0, 86, {
        width: 841.89,
        align: "center",
      });
    const titleSize = fitText(doc, title, "ExtraBold", 34, 650, 24);
    doc
      .font("ExtraBold")
      .fontSize(titleSize)
      .fillColor(palette.blueDeep)
      .text(title, 95, 112, {
        width: 652,
        align: "center",
      });
    doc
      .font("Regular")
      .fontSize(13)
      .fillColor(palette.muted)
      .text(copy.certificatePresentedTo, 120, 159, {
        width: 602,
        align: "center",
      });

    drawAvatar(doc, context, photo);

    const nameSize = fitText(doc, upperName, "ExtraBold", 42, 530, 24);
    doc
      .font("ExtraBold")
      .fontSize(nameSize)
      .fillColor(palette.ink)
      .text(upperName, 254, 226, {
        width: 530,
      });
    doc.moveTo(254, 281).lineTo(770, 281).lineWidth(2).stroke(palette.yellow);

    const achievementSize = fitText(
      doc,
      copy.certificateAchievement,
      "Regular",
      15,
      520,
      11,
    );
    doc
      .font("Regular")
      .fontSize(achievementSize)
      .fillColor(palette.muted)
      .text(copy.certificateAchievement, 254, 305, {
        width: 520,
      });
    const earnedTitleSize = fitText(doc, title, "ExtraBold", 26, 490, 18);
    doc
      .font("ExtraBold")
      .fontSize(earnedTitleSize)
      .fillColor(palette.coral)
      .text(title, 254, 342, {
        width: 490,
      });

    doc.roundedRect(252, 388, 252, 70, 10).fillAndStroke(palette.cream, palette.orange);
    doc
      .polygon([252, 388], [334, 388], [322, 405], [252, 405])
      .fill(palette.coral);
    doc
      .font("ExtraBold")
      .fontSize(16)
      .fillColor(palette.ink)
      .text(copy.certificateFirstPlace, 270, 405);
    doc
      .font("Bold")
      .fontSize(11)
      .fillColor(palette.blueDeep)
      .text(
        `${copy.certificateScore}: ${formatPoints(context.score, context.locale)} ${copy.points}`,
        270,
        425,
      );
    doc
      .font("Regular")
      .fontSize(9)
      .fillColor(palette.muted)
      .text(
        `${context.correctAnswers} ${copy.correctOutOf} ${context.totalQuestions}`,
        270,
        442,
      );

    drawOfficialSeal(doc, copy);

    doc
      .font("Bold")
      .fontSize(11)
      .fillColor(palette.blueDeep)
      .text(eventLine, 252, 476, {
        width: 300,
      });
    doc.moveTo(560, 480).lineTo(760, 480).lineWidth(1).stroke(palette.muted);
    doc
      .font("Regular")
      .fontSize(10)
      .fillColor(palette.muted)
      .text(copy.certificateSignature, 560, 492, {
        width: 200,
        align: "center",
      });

    doc.end();
  });
}
