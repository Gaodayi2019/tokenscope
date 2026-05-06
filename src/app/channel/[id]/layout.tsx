import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://token-scope.com";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let channelName = id;
  let channelDesc = "";

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("channels")
      .select("name, description, description_en")
      .eq("id", id)
      .single();
    if (data) {
      channelName = data.name || id;
      channelDesc = data.description_en || data.description || "";
    }
  } catch {
    // fallback to id
  }

  return {
    title: channelName,
    description:
      channelDesc ||
      `View ${channelName} details — pricing, models, ratings, uptime, and user reviews on TokenScope.`,
    alternates: {
      canonical: `${siteUrl}/channel/${id}`,
    },
    openGraph: {
      title: `${channelName} | TokenScope`,
      description:
        channelDesc ||
        `View ${channelName} details — pricing, models, ratings, and reviews.`,
      url: `${siteUrl}/channel/${id}`,
    },
  };
}

export default function ChannelDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
