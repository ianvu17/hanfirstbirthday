"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AssetPlaceholderProps = {
  label: string;
  alt: string;
  src?: string;
  ratio?: "square" | "portrait" | "landscape" | "wide";
  objectPosition?: string;
  className?: string;
};

const ratioClass = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]"
};

export function AssetPlaceholder({
  label,
  alt,
  src,
  ratio = "landscape",
  objectPosition = "center",
  className
}: AssetPlaceholderProps) {
  const [failed, setFailed] = useState(false);
  const shouldShowImage = Boolean(src) && !failed;

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border border-border bg-surface-paper shadow-lift",
        ratioClass[ratio],
        className
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
        <div className="paper-texture flex h-full w-full items-center justify-center bg-surface-deep p-5 text-center">
          <div className="relative max-w-[14rem] space-y-3">
            <div className="gingham-yellow mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-party-orange/30 shadow-lift">
              <ImageIcon className="h-8 w-8 text-foreground" aria-hidden="true" />
            </div>
            <figcaption className="text-sm font-bold leading-5 text-muted-foreground">
              {label}
            </figcaption>
          </div>
        </div>
      )}
    </figure>
  );
}
