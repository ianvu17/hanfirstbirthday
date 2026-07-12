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

export function BalloonCluster({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 190 250"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M84 118c-20 35-32 70-36 114M102 120c11 36 18 73 22 112M70 118c-8 36-9 73-4 112"
        fill="none"
        stroke="hsl(var(--border-strong) / 0.24)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse
        cx="58"
        cy="70"
        rx="42"
        ry="56"
        className="fill-party-orange"
        transform="rotate(-12 58 70)"
      />
      <ellipse
        cx="105"
        cy="58"
        rx="43"
        ry="58"
        className="fill-party-blue"
        transform="rotate(8 105 58)"
      />
      <ellipse
        cx="124"
        cy="103"
        rx="43"
        ry="55"
        className="fill-party-red"
        transform="rotate(15 124 103)"
      />
      <ellipse
        cx="70"
        cy="126"
        rx="34"
        ry="42"
        className="fill-surface-paper"
        stroke="hsl(var(--border-strong) / 0.22)"
        strokeWidth="3"
      />
      <path
        d="M54 113c6-4 12-5 18-2M78 119c7 2 13 6 16 12"
        fill="none"
        stroke="hsl(var(--border-strong) / 0.72)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="60" cy="128" r="4" className="fill-foreground" />
      <circle cx="82" cy="125" r="4" className="fill-foreground" />
      <circle cx="49" cy="142" r="6" className="fill-party-pink" />
      <circle cx="92" cy="140" r="6" className="fill-party-pink" />
    </svg>
  );
}

export function GiftStack({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 220 150"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect
        x="18"
        y="72"
        width="72"
        height="58"
        rx="10"
        className="fill-party-orange"
        stroke="hsl(var(--border-strong) / 0.14)"
        strokeWidth="3"
      />
      <path d="M52 72v58M18 92h72" className="stroke-surface-paper" strokeWidth="8" />
      <rect
        x="82"
        y="40"
        width="80"
        height="90"
        rx="11"
        className="fill-party-blue"
        stroke="hsl(var(--border-strong) / 0.14)"
        strokeWidth="3"
      />
      <path d="M122 40v90M82 67h80" className="stroke-surface-paper" strokeWidth="9" />
      <rect
        x="144"
        y="82"
        width="56"
        height="48"
        rx="9"
        className="fill-party-green"
        stroke="hsl(var(--border-strong) / 0.14)"
        strokeWidth="3"
      />
      <path d="M172 82v48M144 102h56" className="stroke-surface-paper" strokeWidth="7" />
      <path
        d="M93 36c14-24 28-20 29 4M154 36c-16-24-29-18-31 4"
        fill="none"
        className="stroke-surface-paper"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PartyHat({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 90 110"
      className={cn("h-auto", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="46" cy="16" r="10" className="fill-party-blue" />
      <path
        d="M20 96 45 22l25 74z"
        className="fill-party-yellow"
        stroke="hsl(var(--border-strong) / 0.16)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="41" cy="52" r="4" className="fill-party-blue" />
      <circle cx="54" cy="72" r="4" className="fill-party-orange" />
      <path
        d="M27 78c11 7 24 8 39 2"
        fill="none"
        className="stroke-party-blue"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
