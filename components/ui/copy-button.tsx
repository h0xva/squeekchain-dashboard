"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

export function CopyButton({
  value,
  label,
  className,
  icon,
}: {
  /** The text to copy, or a getter for values only known in the browser. */
  value: string | (() => string);
  label: string;
  className?: string;
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof value === "function" ? value() : value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className={clsx(
        "relative grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-1",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "done" : "copy"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={copied ? "text-good" : undefined}
        >
          {copied ? <Check size={15} strokeWidth={2.4} /> : (icon ?? <Copy size={15} />)}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
