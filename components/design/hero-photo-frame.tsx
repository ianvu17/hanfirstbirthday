"use client";

import { Camera, Sparkles } from "lucide-react";
import { useState } from "react";

import { WaveDivider } from "@/components/design/party-motifs";
import { cn } from "@/lib/utils";

type HeroPhotoFrameProps = {
  label: string;
  alt: string;
  src?: string;
  objectPosition?: string;
  className?: string;
  compact?: boolean;
};

export function HeroPhotoFrame({
  label,
  alt,
  src,
  objectPosition = "center",
  className,
  compact = false
}: HeroPhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const shouldShowImage = Boolean(src) && !failed;

  return (
    <figure
      className={cn(
        "relative mx-auto w-full max-w-[22rem] pb-3 pl-3 pt-6",
        compact && "max-w-[16rem] pt-4",
        className
      )}
    >
      <div
        className="gingham-yellow absolute inset-x-8 top-0 h-16 rounded-[1.35rem] border border-party-orange/30 shadow-outline"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 right-5 top-8 rounded-[1.75rem] bg-party-blue shadow-sticker"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-4 right-0 top-12 w-10 rounded-r-[1.5rem] border border-white/45 bg-surface-paper/75"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[1.55rem] border border-border bg-surface-paper p-3 shadow-paper">
        <div
          className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-white/70"
          aria-hidden="true"
        />
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.18rem] border border-party-orange/25 bg-surface-deep",
            compact ? "aspect-[4/4.8]" : "aspect-[4/5]"
          )}
        >
          {shouldShowImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <div className="paper-texture flex h-full w-full items-center justify-center p-5 text-center">
              <div className="relative z-10 space-y-4">
                <div className="mx-auto flex h-20 w-20 rotate-[-2deg] items-center justify-center rounded-[1.4rem] border border-party-orange/35 bg-surface-paper shadow-outline">
                  <Camera className="h-10 w-10 text-party-blue-deep" aria-hidden="true" />
                </div>
                <figcaption className="mx-auto max-w-[13rem] text-sm font-extrabold leading-5 text-muted-foreground">
                  {label}
                </figcaption>
              </div>
              <Sparkles
                className="absolute right-5 top-5 h-6 w-6 rotate-12 text-party-orange"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-surface-paper/55"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        <WaveDivider className="mt-3 w-full text-party-blue" />
      </div>
    </figure>
  );
}
