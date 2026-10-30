import type { Metadata } from "next";
import { Suspense } from "react";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Look up any address to see its Squeeks, active power, staked SQK and claimable rewards. Read-only, no wallet required.",
};

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="skeleton mt-24 h-64 w-full rounded-[20px]" />}>
      <PortfolioView />
    </Suspense>
  );
}
