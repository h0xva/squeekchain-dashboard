import { ActivityCard } from "@/components/live/activity-card";
import { LiveHero } from "@/components/live/hero";
import { HowItWorks } from "@/components/live/how-it-works";
import { NetworkStats } from "@/components/live/network-stats";
import { SettlementFeed } from "@/components/live/settlements";

export default function LivePage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <LiveHero />
      <NetworkStats />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <ActivityCard />
        <SettlementFeed />
      </div>
      <HowItWorks />
    </div>
  );
}
