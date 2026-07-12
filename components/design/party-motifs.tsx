import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

export function Bunting({ className, ...props }: SVGProps<SVGSVGElement>) {
  const flags = [
    "fill-party-red",
    "fill-party-yellow",
    "fill-party-blue",
    "fill-surface-paper",
    "fill-party-orange",
    "fill-party-pink",
    "fill-surface-paper",
    "fill-party-blue",
    "fill-party-pink",
    "fill-party-red"
  ];

  return (
    <svg
      viewBox="0 0 760 120"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M20 16c118 20 224 30 360 30s250-10 360-30"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-party-orange/45"
        strokeLinecap="round"
      />
      {flags.map((fill, index) => {
        const x = 52 + index * 70;
        const y = 22 + Math.sin(index) * 5;

        return (
          <path
            key={`${fill}-${index}`}
            d={`M${x} ${y}h54l-22 72z`}
            className={cn(fill, "stroke-foreground/15")}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

export function CloudMotif({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 220 110"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M58 92c-28 0-46-17-46-40 0-22 18-39 42-39 9 0 18 3 25 8 9-13 24-20 42-20 26 0 47 17 51 40 22 2 38 17 38 37 0 22-18 39-45 39H58z"
        fill="currentColor"
        stroke="hsl(var(--border-strong) / 0.12)"
        strokeWidth="4"
      />
    </svg>
  );
}

export function StarCluster({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 150 150"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="m75 10 12 36 38 1-30 22 11 37-31-22-31 22 11-37-30-22 38-1z"
        fill="currentColor"
        stroke="hsl(var(--border-strong) / 0.14)"
        strokeWidth="5"
      />
      <path
        d="m26 94 6 18 19 1-16 11 6 18-15-11-15 11 6-18-16-11 19-1z"
        className="fill-party-orange"
      />
      <path
        d="m119 78 5 13 14 1-11 8 4 14-12-8-12 8 4-14-11-8 14-1z"
        className="fill-party-yellow"
      />
    </svg>
  );
}

export function WaveDivider({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 720 80"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M0 42c60-28 120-28 180 0s120 28 180 0 120-28 180 0 120 28 180 0v38H0z"
        className="fill-party-blue"
      />
      <path
        d="M0 36c60-28 120-28 180 0s120 28 180 0 120-28 180 0 120 28 180 0"
        fill="none"
        stroke="hsl(var(--surface-paper))"
        strokeWidth="8"
      />
    </svg>
  );
}
