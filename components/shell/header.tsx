"use client";

import clsx from "clsx";
import { LoaderCircle, Wallet } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import { shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { HamsterMark } from "@/components/ui/brand";
import { StatusDot } from "@/components/ui/status-dot";
import { AddressAvatar } from "@/components/portfolio/address-avatar";
import { NAV, isActive } from "./nav";
import { StatusPill } from "./status-pill";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { account, connecting, connect } = useWallet();
  const { data, mode } = useDashboard();
  const wheelLive = data?.telemetry === "live";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 rounded-xl pr-2" aria-label="Squeekchain community dashboard, home">
          <HamsterMark size={30} className="transition-transform duration-500 group-hover:rotate-[18deg]" />
          <span className="leading-none">
            <span className="block text-[15px] font-semibold tracking-[-0.02em] text-ink-1">Squeekchain</span>
            <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">Community dashboard</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                  active ? "text-ink-1" : "text-ink-3 hover:text-ink-1",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-line-strong bg-surface-2"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                  />
                ) : null}
                <span className="relative">{item.label}</span>
                {item.href === "/" && wheelLive ? (
                  <StatusDot tone={mode === "preview" ? "gold" : "good"} pulse className="relative scale-75" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <StatusPill />
          <span className="hidden h-9 items-center gap-2 rounded-full border border-line bg-surface-2/70 px-3 text-[13px] text-ink-2 lg:flex">
            <svg width="10" height="14" viewBox="0 0 10 16" aria-hidden="true" className="text-ink-3">
              <path d="M5 0 0 8.2 5 11l5-2.8L5 0Zm0 12-5-3 5 7 5-7-5 3Z" fill="currentColor" />
            </svg>
            Sepolia
          </span>
          {account ? (
            <Link
              href={`/portfolio?address=${account}`}
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2/70 pl-1 pr-3 text-[13px] font-medium text-ink-1 transition-colors hover:border-line-strong"
            >
              <AddressAvatar address={account} size={26} />
              <span className="hidden font-mono text-xs sm:inline">{shortAddress(account)}</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled={connecting}
              onClick={async () => {
                const address = await connect();
                router.push(address ? `/portfolio?address=${address}` : "/portfolio");
              }}
              className="group relative flex h-9 items-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(110deg,#3d7bff,#2bd4f0)] px-3.5 text-[13px] font-semibold text-[#03121a] shadow-[0_0_24px_-6px_rgb(43_212_240/0.7)] transition-[transform,box-shadow] hover:shadow-[0_0_32px_-4px_rgb(43_212_240/0.9)] active:scale-[0.97]"
            >
              <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgb(255_255_255/0.45),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
              {connecting ? <LoaderCircle size={15} className="relative animate-spin" /> : <Wallet size={15} className="relative" />}
              <span className="relative hidden sm:inline">{connecting ? "Connecting" : "Connect"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-line-strong bg-surface-2/90 p-1.5 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-medium transition-colors",
              active ? "text-ink-1" : "text-ink-3",
            )}
          >
            {active ? (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-xl bg-surface-3"
                transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
              />
            ) : null}
            <Icon size={18} className={clsx("relative", active && "text-cyan")} />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
