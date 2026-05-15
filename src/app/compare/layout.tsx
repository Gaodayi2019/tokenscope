import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

export const metadata: Metadata = {
  title: "Compare AI Model Providers",
  description:
    "Compare AI model providers side by side — pricing, latency, uptime, features, and user reviews for GPT, Claude, DeepSeek and more.",
  alternates: {
    canonical: `${siteUrl}/compare`,
  },
  openGraph: {
    title: "Compare AI Model Providers | TokenScope",
    description:
      "Compare AI model providers side by side — pricing, latency, uptime, features, and user reviews.",
    url: `${siteUrl}/compare`,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Compare", url: `${siteUrl}/compare` },
        ]}
      />
      {children}
    </>
  );
}
