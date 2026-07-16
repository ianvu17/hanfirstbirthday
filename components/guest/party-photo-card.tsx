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
import { useEffect, useMemo, useRef, useState } from "react";

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
import { cn } from "@/lib/utils";

type PartyPhotoCopy = BirthdayContent["screens"]["partyPhoto"];

type StickerKind = "hat" | "crown" | "balloons" | "star" | "one" | "bow";

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
  onSavePhoto: (blob: Blob) => Promise<ParticipantAvatarProjection | null>;
  onSavePreset: (presetId: AvatarPresetId) => Promise<ParticipantAvatarProjection | null>;
  onContinue: () => void;
};

const maxSourceFileSize = 5 * 1024 * 1024;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const stickerKinds: StickerKind[] = ["hat", "crown", "balloons", "star", "one", "bow"];

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

function drawSticker(ctx: CanvasRenderingContext2D, sticker: Sticker, canvasSize: number) {
  const x = sticker.x * canvasSize;
  const y = sticker.y * canvasSize;
  const size = sticker.size;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(4, size * 0.08);
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fffaf0";
  ctx.fillStyle = "#f6b84f";

  if (sticker.kind === "hat") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.48);
    ctx.lineTo(size * 0.42, size * 0.34);
    ctx.lineTo(-size * 0.42, size * 0.34);
    ctx.closePath();
    ctx.fillStyle = "#75b9d6";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -size * 0.48, size * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = "#f6c84f";
    ctx.fill();
  } else if (sticker.kind === "crown") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, size * 0.22);
    ctx.lineTo(-size * 0.36, -size * 0.3);
    ctx.lineTo(-size * 0.12, size * 0.02);
    ctx.lineTo(0, -size * 0.38);
    ctx.lineTo(size * 0.12, size * 0.02);
    ctx.lineTo(size * 0.36, -size * 0.3);
    ctx.lineTo(size * 0.45, size * 0.22);
    ctx.closePath();
    ctx.fillStyle = "#f6c84f";
    ctx.fill();
    ctx.stroke();
  } else if (sticker.kind === "balloons") {
    for (const [dx, color] of [
      [-0.18, "#75b9d6"],
      [0.16, "#f58b5f"],
      [0, "#f6c84f"]
    ] as const) {
      ctx.beginPath();
      ctx.arc(size * dx, -size * 0.1, size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * dx, size * 0.12);
      ctx.lineTo(0, size * 0.42);
      ctx.strokeStyle = "#6f5a46";
      ctx.stroke();
      ctx.strokeStyle = "#fffaf0";
    }
  } else if (sticker.kind === "star") {
    ctx.beginPath();
    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? size * 0.44 : size * 0.19;
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
    ctx.fillStyle = "#f6c84f";
    ctx.fill();
    ctx.stroke();
  } else if (sticker.kind === "one") {
    ctx.font = `900 ${size * 0.78}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("1", 0, 0);
    ctx.fillStyle = "#f58b5f";
    ctx.fillText("1", 0, 0);
  } else {
    ctx.beginPath();
    ctx.ellipse(-size * 0.18, 0, size * 0.24, size * 0.16, -0.35, 0, Math.PI * 2);
    ctx.ellipse(size * 0.18, 0, size * 0.24, size * 0.16, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#75b9d6";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#f6c84f";
    ctx.fill();
  }

  ctx.restore();
}

async function canvasToAvatarBlob(canvas: HTMLCanvasElement) {
  const preferred = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86)
  );

  if (preferred) {
    return preferred;
  }

  const fallback = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.84)
  );

  if (!fallback) {
    throw new Error("image_export_failed");
  }

  return fallback;
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
  const streamRef = useRef<MediaStream | null>(null);
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
    const blob = await canvasToAvatarBlob(canvas);
    resetEditor(createObjectUrl(blob));
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
      const next = current.slice(0, 2);
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

      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(0, 0, size, size);

      const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
      const drawWidth = image.naturalWidth * coverScale;
      const drawHeight = image.naturalHeight * coverScale;
      const drawX = (size - drawWidth) / 2 + offsetX * 2;
      const drawY = (size - drawHeight) / 2 + offsetY * 2;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      for (const sticker of stickers) {
        drawSticker(ctx, sticker, size);
      }

      const blob = await canvasToAvatarBlob(canvas);
      const previewUrl = createObjectUrl(blob);
      const updated = await onSavePhoto(blob);

      if (preparedPhoto?.previewUrl) {
        URL.revokeObjectURL(preparedPhoto.previewUrl);
      }

      setPreparedPhoto({
        blob,
        previewUrl: updated?.type === "photo" ? updated.url : previewUrl
      });
      setSelectedPresetId(null);
      setStatus(copy.validation.saved);
    } catch {
      setError(copy.validation.uploadFailed);
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
    } catch {
      setSelectedPresetId(presetId);
      setStatus(copy.presetReady);
      setError(copy.validation.uploadFailed);
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
                  <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[1.2rem] border border-party-blue/25 bg-surface-sky shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sourceUrl} alt="" className="h-full w-full object-cover" style={transformStyle} />
                    <div className="pointer-events-none absolute inset-0 rounded-full border-[999px] border-foreground/20 shadow-[inset_0_0_0_4px_hsl(var(--surface-paper)/0.9)]" />
                    {stickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => setSelectedStickerId(sticker.id)}
                        className={cn(
                          "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-surface-paper/80 font-display font-extrabold shadow-sticker",
                          selectedStickerId === sticker.id ? "border-party-blue" : "border-white/60"
                        )}
                        style={{
                          left: `${sticker.x * 100}%`,
                          top: `${sticker.y * 100}%`,
                          width: sticker.size,
                          height: sticker.size
                        }}
                        aria-label={`${copy.stickerLabel}: ${sticker.kind}`}
                      >
                        {sticker.kind === "hat" ? "Hat" : sticker.kind === "one" ? "1" : sticker.kind}
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
                        <Button key={kind} type="button" variant="outline" size="sm" onClick={() => addSticker(kind)}>
                          {kind === "one" ? "1" : kind}
                        </Button>
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
