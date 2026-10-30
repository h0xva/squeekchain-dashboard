"use client";

import clsx from "clsx";
import { motion } from "motion/react";

type Option<T extends string> = { value: T; label: string };

/** Pill segmented control; the selection glides between options. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  /** Unique per control, so the sliding pill never jumps between controls. */
  id: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx("inline-flex items-center rounded-full border border-line bg-surface-2/80 p-[3px]", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative h-7 rounded-full px-3 text-xs font-medium transition-colors duration-200",
              active ? "text-ink-1" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-full border border-line-strong bg-surface-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
                transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs for switching the series a chart shows. */
export function MetricTabs<T extends string>({
  value,
  onChange,
  options,
  id,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  id: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center gap-5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative pb-2 text-[13px] font-medium transition-colors",
              active ? "text-ink-1" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {option.label}
            {active ? (
              <motion.span
                layoutId={`tabs-${id}`}
                className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-cyan shadow-[0_0_12px_var(--color-cyan)]"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
