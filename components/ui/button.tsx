import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "touch-target relative inline-flex items-center justify-center gap-2 whitespace-normal rounded-[1.05rem] border text-center text-sm font-extrabold leading-5 shadow-lift transition duration-medium ease-paper before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-px before:bg-white/40 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-party-blue-deep/20 bg-primary text-primary-foreground hover:bg-party-blue-deep",
        secondary:
          "border-party-orange/30 bg-surface-highlight text-card-foreground hover:bg-party-yellow",
        ghost: "border-transparent bg-transparent text-foreground shadow-none hover:bg-warm",
        outline:
          "border-border bg-surface-paper text-foreground hover:border-party-blue hover:bg-surface-sky/55"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4",
        lg: "min-h-14 px-6 py-3 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
