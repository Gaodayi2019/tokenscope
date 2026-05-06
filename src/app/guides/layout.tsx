import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

export const metadata: Metadata = {
  title: "Integration Guides",
  description:
    "Learn how to integrate AI model APIs into your applications — setup guides, authentication, and best practices for popular providers.",
  alternates: {
    canonical: `${siteUrl}/guides`,
  },
  openGraph: {
    title: "Integration Guides | TokenScope",
    description:
      "Learn how to integrate AI model APIs — setup guides, authentication, and best practices.",
    url: `${siteUrl}/guides`,
  },
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
