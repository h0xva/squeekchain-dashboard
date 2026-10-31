import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { MotionConfig } from "motion/react";
import { DashboardProvider } from "@/lib/dashboard-context";
import { WalletProvider } from "@/lib/wallet-context";
import { Footer } from "@/components/shell/footer";
import { Header, MobileNav } from "@/components/shell/header";
import { StatusBanner } from "@/components/shell/status-banner";
import { Toaster } from "@/components/shell/toaster";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: {
    default: "Squeekchain — live from the wheel",
    template: "%s · Squeekchain community dashboard",
  },
  description:
    "Live WHEELY9000 telemetry, progress to the next Squeek block, network analytics and Squeek portfolios — a community dashboard for Squeekchain, the hamster-powered proof-of-work toychain on Ethereum.",
  openGraph: {
    title: "Squeekchain — live from the wheel",
    description: "Watch Squeektoshi mine the next Squeek block in real time.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Squeekchain — live from the wheel" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface-3 focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <MotionConfig reducedMotion="user">
          <DashboardProvider>
            <WalletProvider>
              <Header />
              <main id="main" className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6 md:pt-8">
                <StatusBanner />
                {children}
              </main>
              <Footer />
              <MobileNav />
              <Toaster />
            </WalletProvider>
          </DashboardProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
