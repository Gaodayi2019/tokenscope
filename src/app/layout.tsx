import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/context";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TokenScope — Find the Best AI Model Access",
    template: "%s | TokenScope",
  },
  description:
    "Search, compare, and review AI model providers worldwide — relays, proxies, free tiers, and direct access all in one place.",
  keywords: [
    "AI API",
    "LLM",
    "GPT",
    "Claude",
    "DeepSeek",
    "free API",
    "token proxy",
    "AI relay",
    "model comparison",
    "cheapest AI API",
    "OpenAI API",
    "AI model provider",
    "API relay",
    "API proxy",
    "free LLM",
    "AI gateway",
  ],
  authors: [{ name: "TokenScope" }],
  creator: "TokenScope",
  publisher: "TokenScope",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
    url: siteUrl,
    siteName: "TokenScope",
    title: "TokenScope — Find the Best AI Model Access",
    description:
      "Search, compare, and review AI model providers worldwide — relays, proxies, free tiers, and direct access all in one place.",
    images: [
      {
        url: `${siteUrl}/api/og?title=TokenScope&subtitle=Find the Best AI Model Access`,
        width: 1200,
        height: 630,
        alt: "TokenScope — AI Model Access Comparison Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenScope — Find the Best AI Model Access",
    description:
      "Search, compare, and review AI model providers worldwide — relays, proxies, free tiers, and direct access.",
    images: [`${siteUrl}/api/og?title=TokenScope&subtitle=Find the Best AI Model Access`],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": `${siteUrl}/en`,
      "zh-CN": `${siteUrl}/zh`,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-foreground antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
