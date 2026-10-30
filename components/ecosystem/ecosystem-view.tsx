"use client";

import { ArrowUpRight, BookOpen, Bot, Boxes, Braces, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles } from "lucide-react";
import { CONTRACTS, LINKS, NETWORK, addressUrl, type ContractKey } from "@/lib/contracts";
import { useDashboard } from "@/lib/dashboard-context";
import { shortAddress } from "@/lib/format";
import { GithubIcon, XIcon } from "@/components/ui/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

const SNIPPET = `const API = "${LINKS.apiBase}";
const res = await fetch(\`\${API}/status\`);
const { measurement, builder } = await res.json();

// Is Squeektoshi running? How close is the next block?
console.log(measurement.coreStatus);
console.log(Number(builder.projected?.blockProgress) / 1e9);`;

/** The endpoints this dashboard reads, for builders who want the same data. */
const ENDPOINTS = [
  ["/status", "Live wheel telemetry and the next-block frontier"],
  ["/core", "Settled SqueekCore state"],
  ["/measurement/stats", "Daily activity, typical day, records"],
  ["/settlements", "Settlements and confirmed SQK issuance"],
  ["/economy/state", "SQK supply and staking"],
  ["/events", "Protocol events"],
  ["/accounts/{address}", "Squeeks, power, stake and rewards"],
  ["/squeeks/{id}", "Squeek metadata and artwork"],
] as const;

/** Minimal syntax colouring, derived from the exact text that gets copied. */
function highlight(line: string) {
  const parts: React.ReactNode[] = [];
  const token = /(\/\/.*$)|("[^"]*"|`[^`]*`)|\b(const|await)\b|\b(1e9)\b/g;
  let last = 0;
  for (const match of line.matchAll(token)) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    const className = match[1] ? "text-ink-3" : match[2] ? "text-[#9be7c4]" : match[3] ? "text-[#7aa2ff]" : "text-gold";
    parts.push(
      <span key={match.index} className={className}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  parts.push(line.slice(last));
  return parts;
}

export function EcosystemView() {
  const { live } = useDashboard();
  const deployment = live?.deployment;

  return (
    <div>
      <PageHeader
        eyebrow="Ecosystem"
        title={
          <>
            Squeekchain is <span className="text-gradient-cyan">permissionless.</span>
          </>
        }
        subtitle="Everything on this dashboard comes from public contracts and the public API. Build the next thing on top of the wheel."
      />

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
                <Boxes size={15} className="text-cyan" /> Contracts
              </h2>
              <p className="mt-1 text-[13px] text-ink-3">The {NETWORK.name} deployment this dashboard is pinned to</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-2">
              {deployment?.status === "verified" ? (
                <ShieldCheck size={13} className="text-good" />
              ) : deployment?.status === "mismatch" ? (
                <ShieldAlert size={13} className="text-warn" />
              ) : (
                <ShieldQuestion size={13} className="text-ink-3" />
              )}
              {deployment?.status === "verified"
                ? "API matches"
                : deployment?.status === "mismatch"
                  ? "API reports another deployment"
                  : "Not checked yet"}
            </span>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {(Object.keys(CONTRACTS) as ContractKey[]).map((key) => {
              const contract = CONTRACTS[key];
              const mismatch = deployment?.mismatches.find((item) => item.expected === contract.address.toLowerCase());
              return (
                <li key={key} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink-1">
                      {contract.label}
                      {mismatch ? (
                        <span className="rounded-full border border-warn/30 px-1.5 py-px text-[10px] font-medium text-warn" title={`API reports ${mismatch.received}`}>
                          API: {shortAddress(mismatch.received)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-3">{contract.role}</div>
                    <code className="mt-1.5 block truncate font-mono text-[12px] text-ink-2">{contract.address}</code>
                  </div>
                  <CopyButton value={contract.address} label={`Copy ${contract.label} address`} />
                  <a
                    href={addressUrl(contract.address)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${contract.label} on Etherscan`}
                    title="View on Etherscan"
                    className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-1"
                  >
                    <ArrowUpRight size={15} />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-5 text-ink-3">
            Chain data is withheld whenever the API reports a different deployment, so numbers from two deployments never mix.
          </p>
        </Panel>

        <Panel className="flex flex-col p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink-1">
            <Braces size={15} className="text-cyan" /> Read the wheel from anywhere
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">No key, no SDK — the public API answers plain HTTPS.</p>
          <div className="relative mt-4 overflow-hidden rounded-xl border border-line bg-[#070a10]">
            <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
              <span className="font-mono text-[11px] text-ink-3">status.js</span>
              <CopyButton value={SNIPPET} label="Copy snippet" className="size-7" />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-[1.75] text-ink-2">
              <code>
                {SNIPPET.split("\n").map((line, index) => (
                  <span key={index} className="block min-h-[1.75em]">
                    {highlight(line)}
                  </span>
                ))}
              </code>
            </pre>
          </div>
          <div className="mt-4 text-xs font-medium text-ink-2">Endpoints this dashboard reads</div>
          <ul className="mt-2 flex-1 divide-y divide-line text-xs">
            {ENDPOINTS.map(([path, description]) => (
              <li key={path} className="flex items-baseline gap-3 py-2">
                <code className="shrink-0 font-mono text-[11.5px] text-cyan">{path}</code>
                <span className="truncate text-ink-3">{description}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Resource href={LINKS.api} icon={<BookOpen size={15} />} title="API reference" />
            <Resource href={LINKS.buildWithAi} icon={<Bot size={15} />} title="Build with AI" />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 md:grid-cols-3">
        <LinkCard href={LINKS.genesis} eyebrow="Official" title="Genesis" body="Mint and manage Genesis Squeeks." />
        <LinkCard href={LINKS.developers} eyebrow="Docs" title="Developers" body="Contracts, events and integration guides." />
        <LinkCard href={LINKS.x} eyebrow="Community" title="@squeekchain" body="Announcements, Aura farming and builder news." icon={<XIcon size={13} />} />
      </div>

      <Panel spotlight={false} className="mt-4 overflow-hidden sm:mt-5">
        <div className="spoke-field pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
              <Sparkles size={13} /> Community apps · coming soon
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-ink-1">Built something on Squeekchain?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              This page will list community dashboards, games and SqueekFi tools, clearly marked apart from official projects. This
              dashboard is open source — open a pull request to add yours.
            </p>
          </div>
          <a
            href={LINKS.repo}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface-2 px-4 py-2.5 text-[13px] font-medium text-ink-1 transition-colors hover:bg-surface-3"
          >
            <GithubIcon size={15} /> View the source
          </a>
        </div>
      </Panel>
    </div>
  );
}

function Resource({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink-1"
    >
      <span className="text-cyan">{icon}</span>
      {title}
      <ArrowUpRight size={13} className="ml-auto text-ink-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
    </a>
  );
}

function LinkCard({ href, eyebrow, title, body, icon }: { href: string; eyebrow: string; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group block">
      <Panel as="div" className="h-full p-5 transition-colors group-hover:border-line-strong">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{eyebrow}</span>
          <ArrowUpRight size={15} className="text-ink-3 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-base font-semibold text-ink-1">
          {icon}
          {title}
        </div>
        <p className="mt-1 text-[13px] leading-5 text-ink-3">{body}</p>
      </Panel>
    </a>
  );
}
