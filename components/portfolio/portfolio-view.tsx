"use client";

import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleAlert,
  Coins,
  Eye,
  FlaskConical,
  Layers,
  Link2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { demoAccount, demoActivity, demoSqueeks, isAddress, isUnsigned, type AccountActivity } from "@/lib/account-api";
import { LINKS, NETWORK, addressUrl, txUrl } from "@/lib/contracts";
import { useDashboard } from "@/lib/dashboard-context";
import { baseUnitsToNumber, formatBaseUnits, shortAddress, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { useWallet } from "@/lib/wallet-context";
import { DailyBars } from "@/components/charts/daily-bars";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { ShareOnX } from "@/components/ui/share-button";
import { AddressAvatar } from "./address-avatar";
import { SqueekCard } from "./squeek-card";
import { useAccount } from "./use-account";

type Filter = "all" | "staking" | "wallet";

export function PortfolioView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("address");
  const address = raw && isAddress(raw) ? raw.toLowerCase() : null;
  const wallet = useWallet();
  const { mode, setMode } = useDashboard();
  const [input, setInput] = useState(address ?? "");
  const [inputError, setInputError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const live = useAccount(address);
  const sample = mode === "preview" && !address;

  // Keep the field in step with the URL (header links, back/forward).
  const [syncedAddress, setSyncedAddress] = useState(address);
  if (syncedAddress !== address) {
    setSyncedAddress(address);
    setInput(address ?? "");
  }
  useEffect(() => {
    // A linked wallet opens its own portfolio when no address is in the URL.
    if (!raw && wallet.account) router.replace(`${pathname}?address=${wallet.account}`);
  }, [raw, wallet.account, pathname, router]);

  const account = sample ? demoAccount : live.account;
  const squeeks = sample ? demoSqueeks : live.squeeks;
  const activity = sample ? demoActivity : live.activity;
  const shown = squeeks.filter((squeek) => filter === "all" || squeek.custody === filter);

  function lookup(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!isAddress(value)) {
      setInputError("Enter a valid Ethereum address: 0x followed by 40 hex characters.");
      return;
    }
    setInputError(null);
    router.push(`${pathname}?address=${value.toLowerCase()}`);
  }

  async function connectWallet() {
    const selected = await wallet.connect();
    if (selected) router.push(`${pathname}?address=${selected}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title={
          <>
            Your Squeeks. <span className="text-gradient-gold">Your power.</span>
          </>
        }
        subtitle="Look up any address — no wallet needed. Read-only: this dashboard never asks for a signature or a transaction."
      />

      <Panel spotlight={false} className="p-2">
        <form onSubmit={lookup} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="address" className="sr-only">
            Ethereum address
          </label>
          <div className="flex h-12 flex-1 items-center gap-3 rounded-[14px] bg-surface-2/60 px-4 ring-1 ring-transparent transition focus-within:bg-surface-2 focus-within:ring-cyan/40">
            <Search size={16} className="shrink-0 text-ink-3" />
            <input
              id="address"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setInputError(null);
              }}
              placeholder="Paste any address · 0x…"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={inputError ? true : undefined}
              aria-describedby={inputError ? "address-error" : undefined}
              className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink-1 outline-none placeholder:font-sans placeholder:text-ink-3"
            />
            <button
              type="submit"
              disabled={live.loading}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface-3 px-3 text-xs font-medium text-ink-1 transition-colors hover:bg-[#1b2331]"
            >
              {live.loading ? <LoaderCircle size={13} className="animate-spin" /> : null}
              Look up
            </button>
          </div>
          {wallet.account && wallet.account !== address ? (
            <button
              type="button"
              onClick={() => router.push(`${pathname}?address=${wallet.account}`)}
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-line px-4 text-[13px] font-medium text-ink-1 transition-colors hover:bg-surface-2"
            >
              <AddressAvatar address={wallet.account} size={20} /> My wallet
            </button>
          ) : !wallet.account ? (
            <button
              type="button"
              onClick={connectWallet}
              disabled={wallet.connecting}
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(110deg,#3d7bff,#2bd4f0)] px-5 text-[13px] font-semibold text-[#03121a] shadow-[0_0_24px_-8px_rgb(43_212_240/0.8)] transition-transform active:scale-[0.98]"
            >
              {wallet.connecting ? <LoaderCircle size={15} className="animate-spin" /> : <Wallet size={15} />}
              {wallet.connecting ? "Connecting…" : "Connect wallet"}
            </button>
          ) : null}
        </form>
      </Panel>
      <AnimatePresence>
        {inputError || wallet.error ? (
          <motion.p
            id="address-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 text-[13px] text-warn"
          >
            <CircleAlert size={14} /> {inputError ?? wallet.error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {!address && !sample ? (
        <Welcome onPreview={() => setMode("preview")} />
      ) : (
        <div className="mt-6 space-y-4 sm:space-y-5">
          <AccountBar
            address={address}
            sample={sample}
            connected={!!wallet.account && wallet.account === address}
            chainId={wallet.chainId}
            shareText={shareText(account, squeeks.length)}
            onDisconnect={() => {
              wallet.disconnect();
              router.push(pathname);
            }}
          />

          {live.error && !sample ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-warn/25 bg-warn/[0.05] px-4 py-3 text-[13px] text-ink-2">
              <CircleAlert size={16} className="text-warn" />
              <span className="flex-1">{live.error}</span>
              <button
                type="button"
                onClick={live.retry}
                className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-1 hover:bg-surface-3"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <ClaimableCard
              loading={live.loading && !sample}
              claimable={account?.rewards?.claimableBaseUnits}
              lifetime={account?.rewards?.lifetimePaidBaseUnits}
              dailyAverage={averageEarnings(account?.earnings)}
            />
            <PowerCard
              loading={live.loading && !sample}
              nft={account?.power?.nftPower}
              sqk={account?.power?.sqkPower}
              staked={account?.stake?.principalBaseUnits}
              counts={account?.tokenCounts}
            />
            <EarningsCard loading={live.loading && !sample} earnings={account?.earnings} />
          </div>

          <section aria-labelledby="squeeks-title">
            <div className="mb-4 mt-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="squeeks-title" className="text-lg font-semibold tracking-[-0.02em] text-ink-1">
                  Squeeks{" "}
                  <span className="ml-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs font-normal text-ink-2">
                    {countLabel(account?.tokenCounts, squeeks.length)}
                  </span>
                </h2>
                <p className="mt-1 text-[13px] text-ink-3">Level and staked SQK set each Squeek’s share of every block.</p>
              </div>
              <Segmented
                id="squeek-filter"
                label="Filter Squeeks"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "staking", label: "Staked" },
                  { value: "wallet", label: "In wallet" },
                ]}
              />
            </div>
            {live.loading && !sample ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="skeleton aspect-[4/5] rounded-[20px]" />
                ))}
              </div>
            ) : shown.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {shown.map((squeek, index) => (
                  <SqueekCard key={squeek.tokenId} squeek={squeek} sample={sample} index={index} />
                ))}
              </div>
            ) : (
              <Panel spotlight={false} className="grid place-items-center px-6 py-14 text-center">
                <Sparkles size={22} className="text-ink-3" />
                <p className="mt-3 text-sm text-ink-2">{account ? "No Squeeks match this filter" : "Squeeks unavailable"}</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-ink-3">
                  {account
                    ? "This address holds no Squeeks in this view yet. Genesis Squeeks are capped at 9,999."
                    : "They’ll appear as soon as the API returns this account."}
                </p>
              </Panel>
            )}
            {live.cursor && !sample ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => void live.loadMore()}
                  disabled={live.loadingMore}
                  className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-2 px-4 py-2 text-[13px] font-medium text-ink-1 hover:bg-surface-3"
                >
                  {live.loadingMore ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  Load more Squeeks
                </button>
              </div>
            ) : null}
          </section>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <ActivityCard items={activity} sample={sample} failed={live.activityError && !sample} loading={live.loading && !sample} />
            <GrowCard />
          </div>
        </div>
      )}
    </div>
  );
}

function averageEarnings(earnings?: { date: string; earnedBaseUnits: string }[]): number | null {
  const values = (earnings ?? []).map((day) => baseUnitsToNumber(day.earnedBaseUnits)).filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

const humanize = (kind: string) =>
  kind
    .split("_")
    .map((word, index) => (/^(nft|sqk)$/i.test(word) ? word.toUpperCase() : index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");

function shareText(account: { power?: { nftPower: string; sqkPower: string } } | null, count: number) {
  const power = account?.power && isUnsigned(account.power.nftPower) && isUnsigned(account.power.sqkPower)
    ? Number(account.power.nftPower) + Number(account.power.sqkPower)
    : null;
  return power === null
    ? "My Squeek portfolio on the @squeekchain community dashboard 🐹"
    : `${count} Squeek${count === 1 ? "" : "s"} · ${power.toLocaleString("en-US")} active power on @squeekchain 🐹⚡ My portfolio:`;
}

function countLabel(counts: { wallet: string; staking: string } | undefined, fallback: number) {
  if (counts && isUnsigned(counts.wallet) && isUnsigned(counts.staking)) return (Number(counts.wallet) + Number(counts.staking)).toLocaleString("en-US");
  return fallback.toLocaleString("en-US");
}

function Welcome({ onPreview }: { onPreview: () => void }) {
  return (
    <Panel spotlight={false} className="mt-6 overflow-hidden">
      <div className="spoke-field pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <span className="grid size-12 place-items-center rounded-2xl border border-cyan/25 bg-cyan/[0.06] text-cyan">
            <Eye size={22} />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink-1">Explore any Squeek holder.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-2">
            Paste an address above or connect your wallet to see Squeeks, active power, staked SQK and claimable rewards in one place.
            Every portfolio has a shareable link.
          </p>
          <button
            type="button"
            onClick={onPreview}
            className="mt-6 flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-4 py-2 text-[13px] font-medium text-gold transition-colors hover:bg-gold/[0.1]"
          >
            <FlaskConical size={14} /> Preview a sample portfolio
          </button>
        </div>
        <ul className="space-y-3 text-[13px]">
          {[
            [ShieldCheck, "Read-only", "No signature, no transaction, no approval — ever."],
            [Zap, "Active power, explained", "See how Squeek levels and staked SQK add up."],
            [Link2, "Shareable", "Every lookup lives at its own URL."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <li key={title as string} className="flex gap-3 rounded-2xl border border-line bg-surface-1/70 p-4">
                <I size={16} className="mt-0.5 shrink-0 text-cyan" />
                <span>
                  <span className="block font-medium text-ink-1">{title as string}</span>
                  <span className="mt-0.5 block text-ink-3">{body as string}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}

function AccountBar({
  address,
  sample,
  connected,
  chainId,
  shareText,
  onDisconnect,
}: {
  address: string | null;
  sample: boolean;
  connected: boolean;
  chainId: string | null;
  shareText: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {address ? <AddressAvatar address={address} size={40} /> : <span className="grid size-10 place-items-center rounded-full bg-gold/10 text-gold"><FlaskConical size={18} /></span>}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[15px] text-ink-1">{address ? shortAddress(address) : "Sample holder"}</span>
          <span
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
              sample ? "border-gold/25 bg-gold/[0.06] text-gold" : connected ? "border-good/25 bg-good/[0.06] text-good" : "border-line-strong text-ink-2",
            )}
          >
            {sample ? "Preview" : connected ? "Connected wallet" : "Watching"}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-ink-3">
          {sample ? "Illustrative balances — not a real account" : `Sepolia · read-only`}
          {connected && chainId && chainId.toLowerCase() !== NETWORK.chainIdHex ? " · your wallet is on another network; no switch needed" : ""}
        </div>
      </div>
      {address ? (
        <div className="ml-auto flex items-center gap-1">
          <ShareOnX path={`/portfolio?address=${address}`} text={shareText} className="mr-1" />
          <CopyButton value={address} label="Copy address" />
          <CopyButton
            value={() => `${window.location.origin}/portfolio?address=${address}`}
            label="Copy share link"
            icon={<Link2 size={15} />}
          />
          <a
            href={addressUrl(address)}
            target="_blank"
            rel="noreferrer"
            aria-label="View address on Etherscan"
            title="View on Etherscan"
            className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-1"
          >
            <ArrowUpRight size={15} />
          </a>
          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="ml-1 flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink-1"
            >
              <LogOut size={13} /> Disconnect
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ClaimableCard({
  claimable,
  lifetime,
  dailyAverage,
  loading,
}: {
  claimable?: string;
  lifetime?: string;
  dailyAverage: number | null;
  loading: boolean;
}) {
  const claimableAmount = baseUnitsToNumber(claimable);
  const days = claimableAmount !== null && dailyAverage ? claimableAmount / dailyAverage : null;
  return (
    <Panel className="flex flex-col overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(circle,rgb(245_184_61/0.16),transparent_65%)]" />
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
        <Coins size={15} className="text-gold" /> Claimable rewards
      </div>
      {loading ? (
        <div className="skeleton mt-4 h-10 w-40" />
      ) : (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-gradient-gold text-[40px] font-semibold leading-none tracking-[-0.04em]">{formatBaseUnits(claimable, 2)}</span>
          {claimable ? <span className="text-sm font-medium text-ink-3">SQK</span> : null}
        </div>
      )}
      <p className="mt-2 text-xs text-ink-3">Accrued across the whole account, ready to claim</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-xs">
        <div>
          <dt className="text-ink-3">Lifetime paid</dt>
          <dd className="mt-1 text-sm font-medium text-ink-1">
            {formatBaseUnits(lifetime, 0)} <span className="text-xs font-normal text-ink-3">SQK</span>
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">Equals about</dt>
          <dd className="mt-1 text-sm font-medium text-ink-1">
            {days === null ? "—" : `${days.toLocaleString("en-US", { maximumFractionDigits: 1 })}`}{" "}
            <span className="text-xs font-normal text-ink-3">{days === null ? "" : "days of earnings"}</span>
          </dd>
        </div>
      </dl>
      <a
        href={LINKS.site}
        target="_blank"
        rel="noreferrer"
        className="group mt-auto flex items-center justify-between gap-2 border-t border-line pt-4 text-[13px] font-medium text-ink-2 transition-colors hover:text-gold"
      >
        Claim in the official Squeekchain app
        <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
      </a>
    </Panel>
  );
}

function PowerCard({
  nft,
  sqk,
  staked,
  counts,
  loading,
}: {
  nft?: string;
  sqk?: string;
  staked?: string;
  counts?: { wallet: string; staking: string };
  loading: boolean;
}) {
  const nftPower = nft && isUnsigned(nft) ? Number(nft) : null;
  const sqkPower = sqk && isUnsigned(sqk) ? Number(sqk) : null;
  const total = nftPower !== null && sqkPower !== null ? nftPower + sqkPower : null;
  const nftShare = total ? (nftPower ?? 0) / total : 0;
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
        <Zap size={15} className="text-cyan" /> Active power
      </div>
      {loading ? (
        <div className="skeleton mt-4 h-10 w-28" />
      ) : (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-ink-1">{total === null ? "—" : total.toLocaleString("en-US")}</span>
          {total !== null ? <span className="text-sm font-medium text-ink-3">PWR</span> : null}
        </div>
      )}
      {/* Part-to-whole of two: a stacked bar with a 2px surface gap and a legend. */}
      <div className="mt-5 flex h-2 gap-[2px] overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`Power split: ${nftPower ?? "unknown"} from Squeeks, ${sqkPower ?? "unknown"} from staked SQK`}>
        {total ? (
          <>
            <motion.span className="h-full rounded-l-full bg-cyan-deep" initial={{ width: 0 }} animate={{ width: `${nftShare * 100}%` }} transition={{ type: "spring", stiffness: 60, damping: 18 }} />
            <motion.span className="h-full flex-1 rounded-r-full bg-gold-deep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          </>
        ) : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-[3px] bg-cyan-deep" />
          <dt className="text-ink-3">Squeeks</dt>
          <dd className="ml-auto font-medium text-ink-1 tabular">{nftPower?.toLocaleString("en-US") ?? "—"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-[3px] bg-gold-deep" />
          <dt className="text-ink-3">Staked SQK</dt>
          <dd className="ml-auto font-medium text-ink-1 tabular">{sqkPower?.toLocaleString("en-US") ?? "—"}</dd>
        </div>
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-xs">
        <div>
          <div className="text-ink-3">SQK staked</div>
          <div className="mt-1 font-medium text-ink-1">{formatBaseUnits(staked, 0)}</div>
        </div>
        <div>
          <div className="text-ink-3">Squeeks staked</div>
          <div className="mt-1 font-medium text-ink-1">
            {counts && isUnsigned(counts.staking) && isUnsigned(counts.wallet) ? `${counts.staking} of ${Number(counts.staking) + Number(counts.wallet)}` : "—"}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function EarningsCard({ earnings, loading }: { earnings?: { date: string; earnedBaseUnits: string }[]; loading: boolean }) {
  const points = useMemo(
    () =>
      (earnings ?? []).map((day) => ({
        key: day.date,
        label: new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        value: baseUnitsToNumber(day.earnedBaseUnits),
      })),
    [earnings],
  );
  const known = points.filter((point) => point.value !== null);
  const average = known.length ? known.reduce((total, point) => total + (point.value ?? 0), 0) / known.length : null;
  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
        <ArrowDownLeft size={15} className="text-gold" /> Daily earnings
      </div>
      {loading ? (
        <div className="skeleton mt-4 h-10 w-32" />
      ) : (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-ink-1">
            {average === null ? "—" : average.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
          {average !== null ? <span className="text-sm font-medium text-ink-3">SQK / day</span> : null}
        </div>
      )}
      <p className="mt-2 text-xs text-ink-3">Average of the days reported by the API</p>
      <div className="mt-auto flex min-h-[110px] flex-col pt-3">
        {known.length ? (
          <DailyBars data={points} tone="gold" unit="SQK" digits={0} height={110} ariaLabel="SQK earned per day" />
        ) : (
          <p className="text-xs text-ink-3">{loading ? "" : "No earnings history reported."}</p>
        )}
      </div>
    </Panel>
  );
}

const KIND_ICON: Record<string, ReactNode> = {
  claim: <Coins size={15} />,
  nft: <Wallet size={15} />,
  stake: <Layers size={15} />,
};

function ActivityCard({ items, sample, failed, loading }: { items: AccountActivity[]; sample: boolean; failed: boolean; loading: boolean }) {
  const now = useNow(30_000);
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-[15px] font-medium text-ink-1">Recent activity</h2>
      <p className="mt-1 text-[13px] text-ink-3">Claims, deposits and stakes for this address</p>
      <ul className="mt-4 divide-y divide-line">
        {items.map((item, index) => {
          const icon = item.kind.includes("claim") ? KIND_ICON.claim : item.kind.includes("nft") ? KIND_ICON.nft : KIND_ICON.stake;
          const when = item.source?.blockTimestamp;
          const parsed = when ? (/^\d+$/.test(when) ? new Date(Number(when) * 1000).toISOString() : when) : null;
          return (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-cyan">{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-1">{humanize(item.kind)}</div>
                <div className="mt-0.5 text-xs text-ink-3" suppressHydrationWarning>
                  {sample ? ["Example · 2h ago", "Example · 1d ago", "Example · 2d ago"][index] ?? "Example" : parsed ? timeAgo(parsed, now) : "Confirmed on Sepolia"}
                </div>
              </div>
              <span className="text-[13px] font-medium text-ink-1 tabular">
                {item.amountBaseUnits ? `${formatBaseUnits(item.amountBaseUnits, 0)} SQK` : item.tokenId ? `#${item.tokenId}` : "Confirmed"}
              </span>
              {item.source?.transactionHash && /^0x[0-9a-fA-F]{64}$/.test(item.source.transactionHash) ? (
                <a
                  href={txUrl(item.source.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View transaction on Etherscan"
                  className="grid size-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-cyan"
                >
                  <ArrowUpRight size={14} />
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!items.length ? <p className="py-6 text-sm text-ink-3">{loading ? "Loading activity…" : failed ? "Activity is unavailable right now." : "No activity yet."}</p> : null}
    </Panel>
  );
}

function GrowCard() {
  return (
    <Panel className="flex flex-col overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-56 rounded-full bg-[radial-gradient(circle,rgb(43_212_240/0.12),transparent_65%)]" />
      <div className="eyebrow">How rewards work</div>
      <h2 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.02em] text-ink-1">Every block is shared by active power.</h2>
      <p className="mt-2 text-[13px] leading-6 text-ink-3">
        A Squeek’s level and the SQK staked with it set its active power. Each Squeek block mints SQK that is split across holders in proportion to it.
      </p>
      <a
        href={LINKS.genesis}
        target="_blank"
        rel="noreferrer"
        className="group mt-auto flex items-center justify-between gap-2 border-t border-line pt-4 text-[13px] font-medium text-ink-2 transition-colors hover:text-cyan"
      >
        Genesis Squeeks <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
      </a>
    </Panel>
  );
}
