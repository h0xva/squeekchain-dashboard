"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { DASH } from "@/lib/format";

/** Rolls between successive values without re-rendering React on every frame. */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number | null;
  format: (value: number) => string;
  className?: string;
}) {
  const node = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(value);
  const formatRef = useRef(format);
  const reduce = useReducedMotion();

  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const from = previous.current;
    previous.current = value;
    if (value === null) {
      element.textContent = DASH;
      return;
    }
    if (from === null || from === value || reduce) {
      element.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        element.textContent = formatRef.current(latest);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span ref={node} className={className}>
      {value === null ? DASH : format(value)}
    </span>
  );
}
