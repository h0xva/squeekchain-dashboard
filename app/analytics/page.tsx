import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Daily distance, verified work and settled Squeek blocks, the typical day on the wheel and all-time records.",
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
