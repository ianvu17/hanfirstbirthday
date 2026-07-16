"use client";

import {
  Camera,
  Check,
  ImagePlus,
  Minus,
  PartyPopper,
  RefreshCcw,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import {
  avatarPresetIds,
  getAvatarPresetLabel,
  ParticipantAvatar,
  PresetAvatar
} from "@/components/party/participant-avatar";
import { Button } from "@/components/ui/button";
import type { BirthdayContent } from "@/lib/content/schema";
import type { AvatarPresetId, ParticipantAvatarProjection } from "@/lib/party-avatar";
import {
  getPreparedAvatarFileName,
  isPreparedAvatarMimeType,
  type PreparedAvatarMimeType
} from "@/lib/party-avatar-upload";
import { cn } from "@/lib/utils";

type PartyPhotoCopy = BirthdayContent["screens"]["partyPhoto"];

type StickerKind =
  | "party-hat"
  | "crown"
  | "balloons"
  | "confetti"
  | "cupcake"
  | "star"
  | "one"
  | "bow-tie"
  | "glasses";

type Sticker = {
  id: string;
  kind: StickerKind;
  x: number;
  y: number;
  size: number;
};

type PreparedPhoto = {
  blob: Blob;
  previewUrl: string;
};

type PartyPhotoCardProps = {
  copy: PartyPhotoCopy;
  displayName: string;
  currentAvatar?: ParticipantAvatarProjection | null;
  onSavePhoto: (file: File) => Promise<ParticipantAvatarProjection | null>;
  onSavePreset: (presetId: AvatarPresetId) => Promise<ParticipantAvatarProjection | null>;
  onContinue: () => void;
};

const maxSourceFileSize = 5 * 1024 * 1024;
const maxStickers = 3;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const stickerKinds: StickerKind[] = [
  "party-hat",
  "crown",
  "balloons",
  "confetti",
  "cupcake",
  "star",
  "one",
  "bow-tie",
  "glasses"
];

function createObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("invalid_image"));
    image.src = src;
  });
}

function stickerLabel(copy: PartyPhotoCopy, kind: StickerKind) {
  switch (kind) {
    case "party-hat":
      return copy.stickers.partyHat;
    case "crown":
      return copy.stickers.crown;
    case "balloons":
      return copy.stickers.balloons;
    case "confetti":
      return copy.stickers.confetti;
    case "cupcake":
      return copy.stickers.cupcake;
    case "star":
      return copy.stickers.star;
    case "one":
      return copy.stickers.one;
    case "bow-tie":
      return copy.stickers.bowTie;
    case "glasses":
      return copy.stickers.glasses;
  }
}

function StickerArtwork({ kind, className }: { kind: StickerKind; className?: string }) {
  const stroke = "#fffaf0";
  const ink = "#5f4a3b";
  const blue = "#75b9d6";
  const blueDeep = "#2f6f91";
  const yellow = "#f6c84f";
  const orange = "#f58b5f";
  const pink = "#f4a4b8";

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {kind === "party-hat" ? (
        <>
          <path d="M50 12 78 80H22Z" fill={blue} stroke={stroke} strokeWidth="8" strokeLinejoin="round" />
          <path d="M35 49 62 31M42 67 72 49" stroke={yellow} strokeWidth="8" strokeLinecap="round" />
          <circle cx="50" cy="12" r="11" fill={yellow} stroke={stroke} strokeWidth="6" />
          <path d="M25 80h50" stroke={ink} strokeWidth="5" strokeLinecap="round" opacity="0.45" />
        </>
      ) : null}
      {kind === "crown" ? (
        <>
          <path d="M16 72 24 28 42 54 50 22 58 54 76 28 84 72Z" fill={yellow} stroke={stroke} strokeWidth="8" strokeLinejoin="round" />
          <circle cx="24" cy="28" r="7" fill={orange} stroke={stroke} strokeWidth="5" />
          <circle cx="50" cy="22" r="7" fill={blue} stroke={stroke} strokeWidth="5" />
          <circle cx="76" cy="28" r="7" fill={pink} stroke={stroke} strokeWidth="5" />
          <path d="M22 72h56" stroke={ink} strokeWidth="6" strokeLinecap="round" opacity="0.45" />
        </>
      ) : null}
      {kind === "balloons" ? (
        <>
          <path d="M37 48c-11 15-14 25-14 37M53 46c0 16-3 27-12 39M66 49c10 14 12 24 4 36" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="31" cy="31" rx="18" ry="23" fill={blue} stroke={stroke} strokeWidth="7" />
          <ellipse cx="53" cy="25" rx="17" ry="22" fill={yellow} stroke={stroke} strokeWidth="7" />
          <ellipse cx="71" cy="36" rx="16" ry="21" fill={orange} stroke={stroke} strokeWidth="7" />
          <path d="M25 24c4-6 9-8 14-7" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}
      {kind === "confetti" ? (
        <>
          <path d="M20 68 76 28 86 78Z" fill={blue} stroke={stroke} strokeWidth="7" strokeLinejoin="round" />
          <path d="M29 62 77 47M45 50l18 25" stroke={yellow} strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="28" r="7" fill={orange} stroke={stroke} strokeWidth="4" />
          <rect x="57" y="13" width="12" height="12" rx="3" fill={pink} stroke={stroke} strokeWidth="4" transform="rotate(18 63 19)" />
          <path d="M77 13c10 6-4 14 7 20" stroke={orange} strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M31 13c-8 10 8 12 0 23" stroke={yellow} strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {kind === "cupcake" ? (
        <>
          <path d="M28 47c3-18 40-19 44 0 10 2 13 19-1 22H29c-14-3-11-20-1-22Z" fill={pink} stroke={stroke} strokeWidth="7" strokeLinejoin="round" />
          <path d="M29 63h42l-7 24H36Z" fill={yellow} stroke={stroke} strokeWidth="7" strokeLinejoin="round" />
          <path d="M42 65v19M58 65v19" stroke={orange} strokeWidth="5" strokeLinecap="round" />
          <circle cx="49" cy="33" r="6" fill={orange} stroke={stroke} strokeWidth="4" />
          <path d="M50 18v9" stroke={ink} strokeWidth="5" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "star" ? (
        <>
          <path d="M50 12 60 38 88 39 66 57 74 85 50 69 26 85 34 57 12 39 40 38Z" fill={yellow} stroke={stroke} strokeWidth="8" strokeLinejoin="round" />
          <path d="M42 45c2-3 5-4 8-4s6 1 8 4M37 34h.1M63 34h.1" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        </>
      ) : null}
      {kind === "one" ? (
        <>
          <circle cx="50" cy="50" r="37" fill={blue} stroke={stroke} strokeWidth="8" />
          <path d="M41 37 53 28v45" stroke={yellow} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M41 37 53 28v45" stroke={blueDeep} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "bow-tie" ? (
        <>
          <path d="M12 32c19 0 27 9 35 18-8 9-16 18-35 18Z" fill={blue} stroke={stroke} strokeWidth="8" strokeLinejoin="round" />
          <path d="M88 32c-19 0-27 9-35 18 8 9 16 18 35 18Z" fill={orange} stroke={stroke} strokeWidth="8" strokeLinejoin="round" />
          <rect x="42" y="39" width="16" height="22" rx="6" fill={yellow} stroke={stroke} strokeWidth="6" />
        </>
      ) : null}
      {kind === "glasses" ? (
        <>
          <path d="M15 44c8-8 24-8 32 0M53 44c8-8 24-8 32 0M47 48h6" stroke={ink} strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M18 48c0-14 28-14 28 0 0 16-28 16-28 0Z" fill={blue} fillOpacity="0.75" stroke={stroke} strokeWidth="7" />
          <path d="M54 48c0-14 28-14 28 0 0 16-28 16-28 0Z" fill={yellow} fillOpacity="0.8" stroke={stroke} strokeWidth="7" />
          <path d="M26 42h10M62 42h10" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}
    </svg>
  );
}

function drawStickerArtwork(ctx: CanvasRenderingContext2D, sticker: Sticker, canvasSize: number) {
  const x = sticker.x * canvasSize;
  const y = sticker.y * canvasSize;
  const size = sticker.size;
  const s = size;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(5, s * 0.08);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fffaf0";
  const ink = "#5f4a3b";
  const blue = "#75b9d6";
  const yellow = "#f6c84f";
  const orange = "#f58b5f";
  const pink = "#f4a4b8";

  if (sticker.kind === "party-hat") {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.48);
    ctx.lineTo(s * 0.42, s * 0.34);
    ctx.lineTo(-s * 0.42, s * 0.34);
    ctx.closePath();
    ctx.fillStyle = blue;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = yellow;
    ctx.lineWidth = Math.max(4, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.05);
    ctx.lineTo(s * 0.16, -s * 0.28);
    ctx.moveTo(-s * 0.08, s * 0.18);
    ctx.lineTo(s * 0.28, -s * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.48, s * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = yellow;
    ctx.fill();
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = Math.max(4, s * 0.06);
    ctx.stroke();
  } else if (sticker.kind === "crown") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, s * 0.22);
    ctx.lineTo(-s * 0.36, -s * 0.3);
    ctx.lineTo(-s * 0.12, s * 0.02);
    ctx.lineTo(0, -s * 0.38);
    ctx.lineTo(s * 0.12, s * 0.02);
    ctx.lineTo(s * 0.36, -s * 0.3);
    ctx.lineTo(s * 0.45, s * 0.22);
    ctx.closePath();
    ctx.fillStyle = yellow;
    ctx.fill();
    ctx.stroke();
    for (const [cx, cy, color] of [
      [-0.36, -0.3, orange],
      [0, -0.38, blue],
      [0.36, -0.3, pink]
    ] as const) {
      ctx.beginPath();
      ctx.arc(s * cx, s * cy, s * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  } else if (sticker.kind === "balloons") {
    for (const [dx, color] of [
      [-0.22, blue],
      [0.2, orange],
      [0, yellow]
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(s * dx, -s * 0.14, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(s * dx, s * 0.12);
      ctx.quadraticCurveTo(s * dx * 0.6, s * 0.26, 0, s * 0.42);
      ctx.stroke();
      ctx.strokeStyle = "#fffaf0";
      ctx.lineWidth = Math.max(5, s * 0.08);
    }
  } else if (sticker.kind === "confetti") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.25);
    ctx.lineTo(s * 0.32, -s * 0.35);
    ctx.lineTo(s * 0.45, s * 0.38);
    ctx.closePath();
    ctx.fillStyle = blue;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = yellow;
    ctx.lineWidth = Math.max(4, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, s * 0.15);
    ctx.lineTo(s * 0.33, -s * 0.04);
    ctx.moveTo(-s * 0.06, -s * 0.05);
    ctx.lineTo(s * 0.18, s * 0.26);
    ctx.stroke();
    ctx.strokeStyle = orange;
    ctx.beginPath();
    ctx.arc(-s * 0.4, -s * 0.35, s * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = orange;
    ctx.fill();
    ctx.fillStyle = pink;
    ctx.fillRect(s * 0.12, -s * 0.48, s * 0.14, s * 0.14);
  } else if (sticker.kind === "cupcake") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, s * 0.02);
    ctx.bezierCurveTo(-s * 0.3, -s * 0.34, s * 0.3, -s * 0.34, s * 0.34, s * 0.02);
    ctx.bezierCurveTo(s * 0.52, s * 0.04, s * 0.48, s * 0.32, s * 0.24, s * 0.32);
    ctx.lineTo(-s * 0.24, s * 0.32);
    ctx.bezierCurveTo(-s * 0.48, s * 0.32, -s * 0.52, s * 0.04, -s * 0.34, s * 0.02);
    ctx.fillStyle = pink;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.24);
    ctx.lineTo(s * 0.3, s * 0.24);
    ctx.lineTo(s * 0.2, s * 0.5);
    ctx.lineTo(-s * 0.2, s * 0.5);
    ctx.closePath();
    ctx.fillStyle = yellow;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = orange;
    ctx.lineWidth = Math.max(3, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.28);
    ctx.lineTo(-s * 0.05, s * 0.46);
    ctx.moveTo(s * 0.1, s * 0.28);
    ctx.lineTo(s * 0.05, s * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = orange;
    ctx.fill();
  } else if (sticker.kind === "star") {
    ctx.beginPath();
    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? s * 0.44 : s * 0.19;
      const angle = -Math.PI / 2 + (index * Math.PI) / 5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = yellow;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(3, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.04);
    ctx.quadraticCurveTo(0, s * 0.04, s * 0.1, -s * 0.04);
    ctx.stroke();
  } else if (sticker.kind === "one") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.43, 0, Math.PI * 2);
    ctx.fillStyle = blue;
    ctx.fill();
    ctx.stroke();
    ctx.font = `900 ${s * 0.72}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(4, s * 0.07);
    ctx.strokeText("1", 0, 0);
    ctx.fillStyle = yellow;
    ctx.fillText("1", 0, 0);
  } else if (sticker.kind === "bow-tie") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.22);
    ctx.bezierCurveTo(-s * 0.18, -s * 0.2, -s * 0.08, -s * 0.1, 0, 0);
    ctx.bezierCurveTo(-s * 0.08, s * 0.1, -s * 0.18, s * 0.2, -s * 0.45, s * 0.22);
    ctx.closePath();
    ctx.fillStyle = blue;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.45, -s * 0.22);
    ctx.bezierCurveTo(s * 0.18, -s * 0.2, s * 0.08, -s * 0.1, 0, 0);
    ctx.bezierCurveTo(s * 0.08, s * 0.1, s * 0.18, s * 0.2, s * 0.45, s * 0.22);
    ctx.closePath();
    ctx.fillStyle = orange;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-s * 0.12, -s * 0.16, s * 0.24, s * 0.32, s * 0.07);
    ctx.fillStyle = yellow;
    ctx.fill();
    ctx.stroke();
  } else if (sticker.kind === "glasses") {
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(6, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(-s * 0.02, -s * 0.02);
    ctx.lineTo(s * 0.02, -s * 0.02);
    ctx.stroke();
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = Math.max(5, s * 0.07);
    ctx.fillStyle = "rgba(117, 185, 214, 0.78)";
    ctx.beginPath();
    ctx.roundRect(-s * 0.42, -s * 0.16, s * 0.34, s * 0.32, s * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(246, 200, 79, 0.82)";
    ctx.beginPath();
    ctx.roundRect(s * 0.08, -s * 0.16, s * 0.34, s * 0.32, s * 0.12);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function renderFinalAvatar({
  ctx,
  image,
  canvasSize,
  zoom,
  offsetX,
  offsetY,
  stickers
}: {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  canvasSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  stickers: Sticker[];
}) {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const coverScale =
    Math.max(canvasSize / image.naturalWidth, canvasSize / image.naturalHeight) * zoom;
  const drawWidth = image.naturalWidth * coverScale;
  const drawHeight = image.naturalHeight * coverScale;
  const drawX = (canvasSize - drawWidth) / 2 + offsetX * 2;
  const drawY = (canvasSize - drawHeight) / 2 + offsetY * 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  for (const sticker of stickers) {
    drawStickerArtwork(ctx, sticker, canvasSize);
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: PreparedAvatarMimeType,
  quality: number
) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

async function canvasToAvatarFile(canvas: HTMLCanvasElement) {
  const preferred = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86)
  );

  if (preferred && preferred.size > 0 && preferred.type === "image/webp") {
    return new File([preferred], getPreparedAvatarFileName(preferred.type), {
      type: preferred.type
    });
  }

  const fallback = await canvasToBlob(canvas, "image/jpeg", 0.84);

  if (!fallback || fallback.size === 0 || fallback.type !== "image/jpeg") {
    throw new Error("image_export_failed");
  }

  return new File([fallback], getPreparedAvatarFileName(fallback.type), {
    type: fallback.type
  });
}

export function PartyPhotoCard({
  copy,
  displayName,
  currentAvatar,
  onSavePhoto,
  onSavePreset,
  onContinue
}: PartyPhotoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dragRef = useRef<
    | {
        mode: "photo";
        pointerId: number;
        startClientX: number;
        startClientY: number;
        startOffsetX: number;
        startOffsetY: number;
      }
    | {
        mode: "sticker";
        pointerId: number;
        stickerId: string;
      }
    | null
  >(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<"idle" | "starting" | "active">("idle");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [zoom, setZoom] = useState(1.05);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [preparedPhoto, setPreparedPhoto] = useState<PreparedPhoto | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<AvatarPresetId | null>(null);
  const [saving, setSaving] = useState(false);
  const activeSticker = stickers.find((sticker) => sticker.id === selectedStickerId) ?? null;
  const visibleAvatar = preparedPhoto
    ? ({ type: "photo", url: preparedPhoto.previewUrl } as const)
    : selectedPresetId
      ? ({ type: "preset", presetId: selectedPresetId } as const)
      : currentAvatar;

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`
    }),
    [offsetX, offsetY, zoom]
  );

  useEffect(() => {
    return () => {
      stopCamera();
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
      if (preparedPhoto?.previewUrl) {
        URL.revokeObjectURL(preparedPhoto.previewUrl);
      }
    };
  }, [preparedPhoto?.previewUrl, sourceUrl]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraMode("idle");
  }

  function resetEditor(nextSourceUrl: string) {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    setSourceUrl(nextSourceUrl);
    setPreparedPhoto(null);
    setSelectedPresetId(null);
    setZoom(1.05);
    setOffsetX(0);
    setOffsetY(0);
    setStickers([]);
    setSelectedStickerId(null);
    setStatus("");
    setError("");
  }

  async function startCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(copy.validation.cameraUnavailable);
      return;
    }

    try {
      setCameraMode("starting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;
      setCameraMode("active");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (cameraError) {
      stopCamera();
      setError(
        cameraError instanceof DOMException && cameraError.name === "NotAllowedError"
          ? copy.validation.cameraDenied
          : copy.validation.cameraUnavailable
      );
    }
  }

  async function captureSelfie() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError(copy.validation.cameraUnavailable);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError(copy.validation.imageInvalid);
      return;
    }

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    const file = await canvasToAvatarFile(canvas);
    resetEditor(createObjectUrl(file));
  }

  async function handleFile(file: File | undefined) {
    setError("");

    if (!file) {
      return;
    }

    if (!supportedMimeTypes.has(file.type)) {
      setError(copy.validation.unsupportedFile);
      return;
    }

    if (file.size > maxSourceFileSize) {
      setError(copy.validation.fileTooLarge);
      return;
    }

    const nextUrl = createObjectUrl(file);

    try {
      const image = await loadImage(nextUrl);

      if (image.naturalWidth < 96 || image.naturalHeight < 96) {
        throw new Error("small_image");
      }

      resetEditor(nextUrl);
    } catch {
      URL.revokeObjectURL(nextUrl);
      setError(copy.validation.imageInvalid);
    }
  }

  function addSticker(kind: StickerKind) {
    setStickers((current) => {
      if (current.length >= maxStickers) {
        return current;
      }

      const next = current;
      const id = `${kind}-${Date.now().toString(36)}`;
      const sticker: Sticker = {
        id,
        kind,
        x: 0.5,
        y: 0.22 + next.length * 0.16,
        size: 86
      };
      setSelectedStickerId(id);
      return [...next, sticker];
    });
  }

  function moveStickerToPointer(stickerId: string, event: PointerEvent<HTMLElement>) {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const rect = editor.getBoundingClientRect();
    const nextX = (event.clientX - rect.left) / rect.width;
    const nextY = (event.clientY - rect.top) / rect.height;
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === stickerId
          ? {
              ...sticker,
              x: Math.min(0.88, Math.max(0.12, nextX)),
              y: Math.min(0.88, Math.max(0.12, nextY))
            }
          : sticker
      )
    );
  }

  function handleEditorPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!sourceUrl || event.button !== 0) {
      return;
    }

    setSelectedStickerId(null);
    dragRef.current = {
      mode: "photo",
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleEditorPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.mode !== "photo" || drag.pointerId !== event.pointerId) {
      return;
    }

    setOffsetX(drag.startOffsetX + event.clientX - drag.startClientX);
    setOffsetY(drag.startOffsetY + event.clientY - drag.startClientY);
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  function handleStickerPointerDown(stickerId: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    setSelectedStickerId(stickerId);
    dragRef.current = {
      mode: "sticker",
      pointerId: event.pointerId,
      stickerId
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleStickerPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;

    if (!drag || drag.mode !== "sticker" || drag.pointerId !== event.pointerId) {
      return;
    }

    moveStickerToPointer(drag.stickerId, event);
  }

  function updateActiveSticker(patch: Partial<Sticker>) {
    if (!activeSticker) {
      return;
    }

    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === activeSticker.id
          ? {
              ...sticker,
              ...patch,
              x: Math.min(0.88, Math.max(0.12, patch.x ?? sticker.x)),
              y: Math.min(0.88, Math.max(0.12, patch.y ?? sticker.y)),
              size: Math.min(160, Math.max(48, patch.size ?? sticker.size))
            }
          : sticker
      )
    );
  }

  function removeActiveSticker() {
    if (!activeSticker) {
      return;
    }

    setStickers((current) => current.filter((sticker) => sticker.id !== activeSticker.id));
    setSelectedStickerId(null);
  }

  async function prepareAndSavePhoto() {
    if (!sourceUrl || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSelectedStickerId(null);

    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("canvas_unavailable");
      }

      renderFinalAvatar({
        ctx,
        image,
        canvasSize: size,
        zoom,
        offsetX,
        offsetY,
        stickers
      });

      const file = await canvasToAvatarFile(canvas);

      if (!isPreparedAvatarMimeType(file.type) || file.size === 0) {
        throw new Error(copy.validation.imageInvalid);
      }

      const previewUrl = createObjectUrl(file);
      const updated = await onSavePhoto(file);

      if (preparedPhoto?.previewUrl) {
        URL.revokeObjectURL(preparedPhoto.previewUrl);
      }

      setPreparedPhoto({
        blob: file,
        previewUrl: updated?.type === "photo" ? updated.url : previewUrl
      });
      setSelectedPresetId(null);
      setStatus(copy.validation.saved);
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.validation.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  async function selectPreset(presetId: AvatarPresetId) {
    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await onSavePreset(presetId);
      setSelectedPresetId(updated?.type === "preset" ? updated.presetId : presetId);
      setPreparedPhoto(null);
      setStatus(copy.validation.saved);
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.validation.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center py-6"
      data-testid="onboarding-party-photo"
    >
      <PaperPanel tone="celebration" className="overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none cow-soft-spots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4 rounded-[1.25rem] border border-party-orange/25 bg-surface-highlight p-4 text-center shadow-outline">
            <BirthdayBadge tone="coral" className="mx-auto">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              {displayName}
            </BirthdayBadge>
            <ParticipantAvatar avatar={visibleAvatar} displayName={displayName} size="xl" className="mx-auto" />
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
                {copy.title}
              </h1>
              <p className="text-sm font-bold leading-6 text-muted-foreground">{copy.description}</p>
            </div>
            <div aria-live="polite" className="min-h-6 text-sm font-extrabold text-party-blue-deep">
              {status}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Button type="button" variant="secondary" onClick={startCamera} disabled={cameraMode !== "idle"}>
                <Camera aria-hidden="true" />
                {copy.takeSelfie}
              </Button>
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus aria-hidden="true" />
                {copy.choosePhoto}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setSourceUrl(null)}>
                <Sparkles aria-hidden="true" />
                {copy.chooseAvatar}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
            </div>

            {cameraMode !== "idle" ? (
              <div className="space-y-3 rounded-[1.2rem] border border-party-blue/25 bg-surface-sky/65 p-3 shadow-lift">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="aspect-square w-full rounded-[1rem] bg-foreground object-cover [transform:scaleX(-1)]"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={captureSelfie} disabled={cameraMode !== "active"}>
                    <Camera aria-hidden="true" />
                    {copy.capture}
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera}>
                    <X aria-hidden="true" />
                    {copy.cancel}
                  </Button>
                </div>
              </div>
            ) : null}

            {sourceUrl ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="space-y-3">
                  <div
                    ref={editorRef}
                    className="relative mx-auto aspect-square w-full max-w-sm touch-none overflow-hidden rounded-[1.2rem] border border-party-blue/25 bg-surface-sky shadow-inner"
                    onPointerDown={handleEditorPointerDown}
                    onPointerMove={handleEditorPointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceUrl}
                      alt=""
                      className="pointer-events-none h-full w-full select-none object-cover"
                      style={transformStyle}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-full border-[999px] border-foreground/20 shadow-[inset_0_0_0_4px_hsl(var(--surface-paper)/0.9)]" />
                    {stickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        type="button"
                        onPointerDown={(event) => handleStickerPointerDown(sticker.id, event)}
                        onPointerMove={handleStickerPointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={cn(
                          "absolute grid touch-none -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-transparent p-0.5 shadow-sticker transition",
                          selectedStickerId === sticker.id
                            ? "border-party-blue-deep ring-4 ring-party-blue/25"
                            : "border-transparent"
                        )}
                        style={{
                          left: `${sticker.x * 100}%`,
                          top: `${sticker.y * 100}%`,
                          width: sticker.size,
                          height: sticker.size
                        }}
                        aria-label={`${copy.stickerLabel}: ${stickerLabel(copy, sticker.kind)}`}
                      >
                        <StickerArtwork kind={sticker.kind} className="h-full w-full drop-shadow-sm" />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-bold leading-6 text-muted-foreground">{copy.cropHelp}</p>
                </div>

                <div className="space-y-3">
                  <label className="grid gap-1 text-sm font-extrabold text-foreground">
                    {copy.zoomLabel}
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => setOffsetX((value) => value - 14)}>
                      <Minus aria-hidden="true" />
                      X
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOffsetX((value) => value + 14)}>
                      X
                      <PlusIcon />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOffsetY((value) => value - 14)}>
                      <Minus aria-hidden="true" />
                      Y
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOffsetY((value) => value + 14)}>
                      Y
                      <PlusIcon />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-extrabold text-foreground">{copy.stickerLabel}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {stickerKinds.map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => addSticker(kind)}
                          disabled={stickers.length >= maxStickers}
                          aria-label={`Add ${stickerLabel(copy, kind)}`}
                          className="grid aspect-square place-items-center rounded-[0.85rem] border border-border bg-surface-paper p-1.5 shadow-lift transition hover:border-party-blue disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <StickerArtwork kind={kind} className="h-full w-full" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeSticker ? (
                    <div className="space-y-2 rounded-[1rem] border border-border bg-surface-paper p-3">
                      <label className="grid gap-1 text-sm font-extrabold text-foreground">
                        {copy.sizeLabel}
                        <input
                          type="range"
                          min="48"
                          max="160"
                          value={activeSticker.size}
                          onChange={(event) => updateActiveSticker({ size: Number(event.target.value) })}
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => updateActiveSticker({ x: activeSticker.x - 0.04 })}>
                          <Minus aria-hidden="true" />
                          X
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => updateActiveSticker({ x: activeSticker.x + 0.04 })}>
                          X
                          <PlusIcon />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => updateActiveSticker({ y: activeSticker.y - 0.04 })}>
                          <Minus aria-hidden="true" />
                          Y
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => updateActiveSticker({ y: activeSticker.y + 0.04 })}>
                          Y
                          <PlusIcon />
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeActiveSticker}>
                        <X aria-hidden="true" />
                        {copy.removeSticker}
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <Button type="button" onClick={prepareAndSavePhoto} disabled={saving}>
                      <Check aria-hidden="true" />
                      {saving ? copy.photoReady : copy.usePhoto}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSourceUrl(null)}>
                      <RefreshCcw aria-hidden="true" />
                      {copy.retake}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-[1.2rem] border border-party-blue/20 bg-surface-sky/55 p-3">
                <p className="text-sm font-bold leading-6 text-muted-foreground">{copy.uploadHelp}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {avatarPresetIds.map((presetId) => (
                    <button
                      key={presetId}
                      type="button"
                      onClick={() => void selectPreset(presetId)}
                      className={cn(
                        "grid gap-2 rounded-[1rem] border bg-surface-paper p-2 text-center text-xs font-extrabold shadow-lift transition",
                        selectedPresetId === presetId
                          ? "border-party-blue-deep bg-surface-highlight"
                          : "border-border"
                      )}
                    >
                      <span className="mx-auto h-16 w-16">
                        <PresetAvatar presetId={presetId} />
                      </span>
                      <span>{getAvatarPresetLabel(presetId)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-6 text-sm font-bold text-party-red" role={error ? "alert" : "status"}>
              {error}
            </div>

            <Button type="button" size="lg" className="w-full" onClick={onContinue}>
              <PartyPopper aria-hidden="true" />
              {visibleAvatar ? copy.continue : copy.skip}
            </Button>
          </div>
        </div>
      </PaperPanel>
    </section>
  );
}

function PlusIcon() {
  return <span aria-hidden="true">+</span>;
}
