import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type TitleLockupProps = {
  title: string;
  className?: string;
};

const letterColors = [
  "var(--accent-orange)",
  "var(--accent-yellow)",
  "var(--accent-blue)",
  "var(--accent-pink)",
  "var(--surface-paper)",
  "var(--accent-red)"
];

function patternForLetter(letter: string, index: number) {
  if (letter === "O" || letter === "?") {
    return "gingham";
  }

  return index % 5 === 0 ? "plain" : undefined;
}

export function TitleLockup({ title, className }: TitleLockupProps) {
  const words = title.split(" ");
  let letterIndex = 0;

  return (
    <h1
      className={cn(
        "font-display text-[3.05rem] font-extrabold leading-[0.8] text-foreground sm:text-7xl lg:text-8xl",
        className
      )}
      aria-label={title}
    >
      <span aria-hidden="true" className="block space-y-1.5">
        {words.map((word) => (
          <span key={word} className="block whitespace-nowrap">
            {Array.from(word).map((letter) => {
              const currentIndex = letterIndex;
              letterIndex += 1;

              return (
                <span
                  key={`${letter}-${currentIndex}`}
                  className="storybook-letter"
                  data-letter={letter}
                  data-pattern={patternForLetter(letter, currentIndex)}
                  style={
                    {
                      "--letter-color": letterColors[currentIndex % letterColors.length]
                    } as CSSProperties
                  }
                >
                  {letter}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </h1>
  );
}
