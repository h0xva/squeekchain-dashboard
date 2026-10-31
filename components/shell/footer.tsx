import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/contracts";
import { GithubIcon, HamsterMark, XIcon } from "@/components/ui/brand";

export function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-[1240px] px-4 pb-28 sm:px-6 md:pb-12">
      <div className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-1">
            <HamsterMark size={20} /> Built for the Squeekchain community
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-3">
            An independent dashboard, not affiliated with Squeekchain. Every number comes from the public Squeekchain API.
            Sepolia testnet — SQK has no monetary value.
          </p>
        </div>
        <nav aria-label="Resources" className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-ink-3">
          {[
            { href: LINKS.invite, label: "Genesis · invite" },
            { href: LINKS.docs, label: "Docs" },
            { href: LINKS.api, label: "API" },
          ].map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition-colors hover:text-ink-1">
              {link.label} <ArrowUpRight size={11} />
            </a>
          ))}
          <a href={LINKS.x} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink-1">
            <XIcon size={11} /> @squeekchain
          </a>
          <a href={LINKS.repo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink-1">
            <GithubIcon size={13} /> Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
