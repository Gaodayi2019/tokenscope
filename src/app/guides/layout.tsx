import type { Metadata } from "next";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/JsonLd";

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

const guideFaqs = [
  {
    question: "What is an AI API relay?",
    answer:
      "An AI API relay is a proxy service between developers and LLM providers like OpenAI, Anthropic, and Google. You send requests to the relay, which forwards them to the provider and returns the response. Relays are useful for stable access in regions where direct connections are unreliable, local payment methods, free trial credits, and unified API access to multiple models.",
  },
  {
    question: "How can I use AI APIs for free?",
    answer:
      "You can access AI APIs for free through: (1) Major provider free tiers like Google Gemini and Alibaba Qwen; (2) Free credits from relay services, typically $0.5-5 for new users; (3) Self-hosted open-source models using Ollama, HuggingFace Spaces, or Cloudflare Workers AI. TokenScope's free models page lists all available free options.",
  },
  {
    question: "How do I switch between API providers?",
    answer:
      "Most relays and providers are compatible with the OpenAI API format. Switching typically requires only changing the base_url and API key in your client configuration. Some caveats: model names may differ, streaming formats may vary slightly, and advanced features like Function Calling need compatibility verification.",
  },
  {
    question: "How can I find the cheapest AI API?",
    answer:
      "Use TokenScope to compare prices across 159+ providers and 16,000+ models. Key tips: use smaller models for simpler tasks (GPT-4o-mini instead of GPT-4o), set appropriate max_tokens limits, cache repeated queries, and use batch requests. Relays are typically 30-60% cheaper than direct access.",
  },
  {
    question: "Is it safe to use API relays?",
    answer:
      "API relays forward your requests through third-party servers, so data privacy depends on the relay provider. Best practices: choose relays with no-log policies, avoid sending sensitive data (medical, legal) through relays, check the provider's privacy policy, and use direct access for critical applications. Always protect your API keys using environment variables and never commit them to Git.",
  },
];

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Guides", url: `${siteUrl}/guides` },
        ]}
      />
      <FAQJsonLd faqs={guideFaqs} />
      {children}
    </>
  );
}
