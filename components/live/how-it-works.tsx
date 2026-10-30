import { Blocks, Coins, Magnet, RotateCw } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { PROTOCOL } from "@/lib/contracts";
import { Panel } from "@/components/ui/panel";

const STEPS = [
  {
    icon: RotateCw,
    title: "The wheel turns",
    body: "Squeektoshi, a real hamster, runs in the WHEELY9000.",
  },
  {
    icon: Magnet,
    title: "Magnets count work",
    body: "Every pass of the wheel’s magnet is one unit of work.",
  },
  {
    icon: Blocks,
    title: "Work settles on-chain",
    body: "Measured work is verified and settled through SqueekCore.",
  },
  {
    icon: Coins,
    title: "SQK flows to Squeeks",
    body: `Each Squeek block mints ${formatNumber(PROTOCOL.blockRewardSepolia)} SQK, shared by active power.`,
    gold: true,
  },
];

export function HowItWorks() {
  return (
    <Panel spotlight={false} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="eyebrow">Proof of tiny work</div>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-ink-1">From a hamster’s stride to an Ethereum block</h2>
        </div>
      </div>
      <ol className="relative mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div
          aria-hidden="true"
          className="absolute left-[18px] right-[18px] top-[18px] hidden h-px bg-[linear-gradient(90deg,rgb(43_212_240/0.5),rgb(43_212_240/0.15)_60%,rgb(245_184_61/0.5))] lg:block"
        />
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative">
              <span
                className={`relative grid size-9 place-items-center rounded-xl border bg-surface-1 ${
                  step.gold ? "border-gold/30 text-gold" : "border-cyan/25 text-cyan"
                }`}
              >
                <Icon size={16} />
              </span>
              <div className="mt-3 font-mono text-[10.5px] text-ink-3">0{index + 1}</div>
              <h3 className="mt-1 text-sm font-medium text-ink-1">{step.title}</h3>
              <p className="mt-1 text-[13px] leading-5 text-ink-3">{step.body}</p>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
