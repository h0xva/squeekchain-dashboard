"use client";

import clsx from "clsx";
import type { ComponentPropsWithoutRef, PointerEvent } from "react";

type PanelProps = ComponentPropsWithoutRef<"section"> & {
  as?: "section" | "div" | "article";
  /** Pointer-following border light; off for large hero surfaces. */
  spotlight?: boolean;
};

function track(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export function Panel({ as: Tag = "section", spotlight = true, className, children, ...props }: PanelProps) {
  return (
    <Tag
      className={clsx("panel", className)}
      data-spotlight={spotlight ? "" : undefined}
      onPointerMove={spotlight ? track : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.01em] text-ink-1">
          {icon ? <span className="text-ink-3">{icon}</span> : null}
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-5 text-ink-3">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
