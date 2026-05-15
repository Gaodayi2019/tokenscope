import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

export const metadata: Metadata = {
  title: "Browse AI Model Channels",
  description:
    "Browse and filter all AI model access channels — relays, proxies, free tiers, and direct providers. Compare pricing, uptime, and user reviews.",
  alternates: {
    canonical: `${siteUrl}/channels`,
  },
  openGraph: {
    title: "Browse AI Model Channels | TokenScope",
    description:
      "Browse and filter all AI model access channels — relays, proxies, free tiers, and direct providers.",
    url: `${siteUrl}/channels`,
  },
};

export default function ChannelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Channels", url: `${siteUrl}/channels` },
        ]}
      />
      {children}
    </>
  );
}
