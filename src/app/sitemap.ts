import type { MetadataRoute } from "next";

// Use www as canonical — matches CF 308 redirect
const siteUrl = "https://www.token-scope.com";

// Guide article IDs (must match guides/page.tsx)
const guideIds = [
  "what-is-relay",
  "free-models",
  "api-compatibility",
  "price-compare",
  "security",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with alternate languages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: { en: siteUrl, zh: `${siteUrl}?locale=zh` },
      },
    },
    {
      url: `${siteUrl}/channels`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: {
        languages: { en: `${siteUrl}/channels`, zh: `${siteUrl}/channels?locale=zh` },
      },
    },
    {
      url: `${siteUrl}/free`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: { en: `${siteUrl}/free`, zh: `${siteUrl}/free?locale=zh` },
      },
    },
    {
      url: `${siteUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: { en: `${siteUrl}/compare`, zh: `${siteUrl}/compare?locale=zh` },
      },
    },
    {
      url: `${siteUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: { en: `${siteUrl}/guides`, zh: `${siteUrl}/guides?locale=zh` },
      },
    },
    // Guide sub-pages for better indexation
    ...guideIds.map((id) => ({
      url: `${siteUrl}/guides#${id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  // Dynamic channel pages — fetch from Supabase
  let channelPages: MetadataRoute.Sitemap = [];
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Paginate — Supabase default limit is 1000
    let allChannels: { id: string; updated_at: string }[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: channels } = await supabase
        .from("channels")
        .select("id, updated_at")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!channels || channels.length === 0) break;
      allChannels = allChannels.concat(channels);
      if (channels.length < pageSize) break;
      page++;
    }
    channelPages = allChannels.map((ch) => ({
      url: `${siteUrl}/channel/${ch.id}`,
      lastModified: new Date(ch.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If Supabase fetch fails, skip dynamic pages
  }

  return [...staticPages, ...channelPages];
}
