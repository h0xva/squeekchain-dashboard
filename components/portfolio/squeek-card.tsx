"use client";

import clsx from "clsx";
import { ArrowUpRight, Wallet, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { squeekUrl } from "@/lib/contracts";
import type { Squeek } from "@/lib/account-api";

/** Generative placeholder: a wheel tinted by token id, used when no image is published. */
function SqueekArt({ tokenId }: { tokenId: string }) {
  const id = Number(tokenId);
  const hue = (id * 47) % 360;
  const spokes = 6 + (id % 5);
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label={`Squeek #${tokenId} placeholder artwork`}>
      <defs>
        <radialGradient id={`bg-${tokenId}`} cx="50%" cy="35%">
          <stop offset="0" stopColor={`hsl(${hue} 70% 22%)`} />
          <stop offset="1" stopColor="#0a0e15" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#bg-${tokenId})`} />
      <g transform="translate(100 108)" stroke={`hsl(${hue} 85% 70%)`} fill="none">
        <circle r="58" strokeOpacity="0.55" strokeWidth="2" />
        <circle r="48" strokeOpacity="0.2" />
        {Array.from({ length: spokes }, (_, index) => (
          <line key={index} x1="0" y1="0" x2="0" y2="-48" strokeOpacity="0.22" transform={`rotate(${(360 / spokes) * index})`} />
        ))}
        <circle r="7" fill={`hsl(${hue} 85% 70%)`} fillOpacity="0.25" />
        <rect x="-4" y="-61" width="8" height="10" rx="2" fill="#f5b83d" stroke="none" />
      </g>
      <circle cx="74" cy="44" r="10" fill={`hsl(${hue} 60% 80%)`} fillOpacity="0.85" />
      <circle cx="126" cy="44" r="10" fill={`hsl(${hue} 60% 80%)`} fillOpacity="0.85" />
      <text x="16" y="186" fill="#eaf0fa" fillOpacity="0.55" fontSize="13" fontFamily="var(--font-mono), monospace">
        #{tokenId.padStart(4, "0")}
      </text>
    </svg>
  );
}

export function SqueekCard({ squeek, sample = false, index = 0 }: { squeek: Squeek; sample?: boolean; index?: number }) {
  const [failed, setFailed] = useState(false);
  const staked = squeek.custody === "staking";
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, type: "spring", bounce: 0.2, duration: 0.6 }}
      className="group panel overflow-hidden transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {squeek.image && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- token art comes from arbitrary metadata hosts
          <img
            src={squeek.image}
            alt={squeek.name ?? `Squeek #${squeek.tokenId}`}
            onError={() => setFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="size-full transition-transform duration-500 group-hover:scale-[1.04]">
            <SqueekArt tokenId={squeek.tokenId} />
          </div>
        )}
        <span
          className={clsx(
            "absolute left-3 top-3 flex items-center gap-1 rounded-full border px-2 py-1 text-[10.5px] font-medium backdrop-blur-md",
            staked ? "border-good/30 bg-[#06261a]/80 text-good" : "border-line-strong bg-surface-1/80 text-ink-2",
          )}
        >
          {staked ? <Zap size={11} /> : <Wallet size={11} />}
          {staked ? "Staked" : "Wallet"}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-line-strong bg-surface-1/80 px-2 py-1 font-mono text-[10.5px] text-ink-1 backdrop-blur-md">
          LVL {squeek.level}
        </span>
      </div>
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-[13px] font-medium text-ink-1 sm:text-sm">{squeek.name ?? `Squeek #${squeek.tokenId}`}</h3>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-cyan" title="Base power">
            <Zap size={12} />
            {Number(squeek.basePower).toLocaleString("en-US")}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-3">
          <span className="truncate">{staked ? "Earning" : "Deposit to activate"}</span>
          {sample ? (
            <span>sample</span>
          ) : (
            <a
              href={squeekUrl(squeek.tokenId)}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-0.5 transition-colors hover:text-cyan"
              aria-label={`View Squeek #${squeek.tokenId} on Etherscan`}
            >
              Etherscan <ArrowUpRight size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
