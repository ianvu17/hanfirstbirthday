"use client";

import Image, { type StaticImageData } from "next/image";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { WaveDivider } from "@/components/design/party-motifs";
import { cn } from "@/lib/utils";

type HeroPhotoFrameProps = {
  alt: string;
  label?: string;
  src?: string | StaticImageData;
  objectPosition?: string;
  sizes?: string;
  preload?: boolean;
  className?: string;
  compact?: boolean;
};

export function HeroPhotoFrame({
  label,
  alt,
  src,
  objectPosition = "center",
  sizes = "(min-width: 640px) 22rem, (min-width: 375px) 18.5rem, calc(100vw - 4rem)",
  preload = false,
  className,
  compact = false,
}: HeroPhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const imageSource = src && !failed ? src : null;

  return (
    <figure
      data-testid="hero-photo-frame"
      className={cn(
        "relative mx-auto w-full max-w-[22rem] pb-3 pl-3 pt-6",
        compact && "max-w-[16rem] pt-4",
        className,
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
          data-testid="hero-photo-inner"
          className={cn(
            "relative overflow-hidden rounded-[1.18rem] border border-party-orange/25 bg-surface-deep",
            compact ? "aspect-[4/4.8]" : "aspect-[4/5]",
          )}
        >
          {imageSource ? (
            <Image
              src={imageSource}
              alt={alt}
              fill
              sizes={sizes}
              preload={preload}
              onError={() => setFailed(true)}
              data-testid="hero-photo-image"
              className="object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <div className="paper-texture flex h-full w-full items-center justify-center p-5 text-center">
              <div className="relative z-10 space-y-4">
                {label ? (
                  <figcaption className="mx-auto max-w-[13rem] text-sm font-extrabold leading-5 text-muted-foreground">
                    {label}
                  </figcaption>
                ) : null}
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
