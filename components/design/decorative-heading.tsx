import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DecorativeHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  size?: "page" | "section" | "display";
  className?: string;
};

const headingSize = {
  page: "text-5xl sm:text-6xl lg:text-7xl",
  section: "text-3xl sm:text-4xl",
  display: "text-5xl sm:text-7xl lg:text-8xl"
};

export function DecorativeHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "page",
  className
}: DecorativeHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? <div>{eyebrow}</div> : null}
      <h1
        className={cn(
          "headline-outline font-display font-extrabold leading-[0.98] text-foreground",
          headingSize[size]
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
