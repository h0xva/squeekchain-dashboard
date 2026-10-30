import type { Metadata } from "next";
import { EcosystemView } from "@/components/ecosystem/ecosystem-view";

export const metadata: Metadata = {
  title: "Ecosystem",
  description: "Squeekchain contracts, the public API in three lines, official resources and community apps.",
};

export default function EcosystemPage() {
  return <EcosystemView />;
}
