"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps } from "react";

type SoftEntranceProps = ComponentProps<typeof motion.div>;

export function SoftEntrance({ children, ...props }: SoftEntranceProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
