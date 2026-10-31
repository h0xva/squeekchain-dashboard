"use client";

import clsx from "clsx";
import { LINKS } from "@/lib/contracts";
import { XIcon } from "./brand";

/** Opens a pre-filled post on X. The URL is resolved at click time (browser only). */
export function ShareOnX({
  text,
  path,
  className,
  label = "Share",
}: {
  text: string;
  /** Path on this site to share, e.g. "/" or "/portfolio?address=0x…". */
  path: string;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}${path}`;
        // X previews the last link, so the dashboard URL goes last and keeps the card.
        const body = `${text}\n\n🐹 Get a Squeek: ${LINKS.invite}\n📊 ${url}`;
        const intent = `https://x.com/intent/post?text=${encodeURIComponent(body)}`;
        window.open(intent, "_blank", "noopener,noreferrer");
      }}
      className={clsx(
        "flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface-2 px-3 text-xs font-medium text-ink-1 transition-colors hover:bg-surface-3",
        className,
      )}
      aria-label={`${label} on X`}
    >
      <XIcon size={11} />
      {label}
    </button>
  );
}
