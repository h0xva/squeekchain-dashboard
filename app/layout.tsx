import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squeekchain — The little wheel that could",
  description: "Live Squeekchain telemetry, network analytics and your Squeeks portfolio.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

