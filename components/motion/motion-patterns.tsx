"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

type MotionRevealProps = ComponentProps<typeof motion.div> & {
  pattern?: "page" | "paper" | "celebrate";
};

const transition = {
  page: { duration: 0.46, ease: [0.2, 0.8, 0.2, 1] },
  paper: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] },
  celebrate: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }
} as const;

const initial = {
  page: { opacity: 0, y: 18 },
  paper: { opacity: 0, y: 14, rotate: -1.5 },
  celebrate: { opacity: 0, scale: 0.96 }
} as const;

export function MotionReveal({
  children,
  pattern = "page",
  ...props
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : initial[pattern]}
      animate={
        prefersReducedMotion
          ? undefined
          : { opacity: 1, y: 0, rotate: 0, scale: 1 }
      }
      transition={transition[pattern]}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggeredRevealProps = {
  children: ReactNode;
  className?: string;
};

export function StaggeredReveal({ children, className }: StaggeredRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.07
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({
  children,
  ...props
}: ComponentProps<typeof motion.div>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        prefersReducedMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 }
            }
      }
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
