import { Activity, ChartColumn, Orbit, Wallet, type LucideIcon } from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Live", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/ecosystem", label: "Ecosystem", icon: Orbit },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
