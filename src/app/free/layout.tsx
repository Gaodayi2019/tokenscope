import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

export const metadata: Metadata = {
  title: "Free AI Models & APIs",
  description:
    "Discover free AI model APIs and providers — GPT, Claude, DeepSeek, Llama and more. Compare free tiers, rate limits, and usage caps.",
  alternates: {
    canonical: `${siteUrl}/free`,
  },
  openGraph: {
    title: "Free AI Models & APIs | TokenScope",
    description:
      "Discover free AI model APIs and providers — compare free tiers, rate limits, and usage caps.",
    url: `${siteUrl}/free`,
  },
};

export default function FreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Free Models", url: `${siteUrl}/free` },
        ]}
      />
      {children}
    </>
  );
}
