import { Container } from "@/components/Container";
import { HomeHero } from "@/components/HomeHero";
import { InfiniteDiscoveryFeed } from "@/components/InfiniteDiscoveryFeed";
import { TrendingDiscoverySection } from "@/components/TrendingDiscoverySection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getNews, getVideos } from "@/lib/content";
import {
  buildTrendingDiscoveryItems,
  getDiscoveryCategories,
} from "@/services/discovery/personalization";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const discoveryCategories = getDiscoveryCategories(user?.preferredCategories ?? []);
  const primaryCategory = discoveryCategories[0] ?? "Technology";
  const [preferredArticles, generalArticles, preferredVideos, generalVideos] = await Promise.all([
    getNews(primaryCategory, 12),
    getNews("technology", 12),
    getVideos(primaryCategory, 12),
    getVideos("technology", 12),
  ]);
  const allArticles = [...preferredArticles, ...generalArticles];
  const allVideos = [...preferredVideos, ...generalVideos];
  const trendingItems = await buildTrendingDiscoveryItems(
    allArticles,
    allVideos,
    discoveryCategories,
    9,
  );
  const initialFeedItems = trendingItems.slice(3);
  const personalizedLabel = user?.preferredCategories.length
    ? `Personalized around ${discoveryCategories.join(", ")}`
    : "Balanced discovery mix";

  return (
    <div className="relative overflow-hidden py-6 sm:py-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30rem),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.10),transparent_28rem)]" />
      <Container>
        <HomeHero
          label={personalizedLabel}
          articleCount={allArticles.length}
          videoCount={allVideos.length}
          trendingItems={trendingItems}
        />

        <TrendingDiscoverySection items={trendingItems} />

        <InfiniteDiscoveryFeed
          initialItems={initialFeedItems}
          initialPage={1}
          category={primaryCategory}
        />
      </Container>
    </div>
  );
}
