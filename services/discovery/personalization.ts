import type { Video } from "@/components/VideoCard";
import { DEFAULT_CATEGORY, inferCategoryFromText, type Category } from "@/lib/categoryTypes";
import type { DiscoveryItem } from "@/lib/discoveryTypes";
import type { NewsArticle } from "@/lib/newsTypes";
import { prisma } from "@/lib/prisma";

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function toTimestamp(value?: string | Date | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getArticleCategory(article: NewsArticle) {
  return inferCategoryFromText(article.category, article.title, article.description, article.source);
}

function getVideoCategory(video: Video) {
  return inferCategoryFromText(video.title, video.description, video.channel);
}

function normalizeScore(score: number) {
  return Math.max(1, Math.min(99, Math.round(score)));
}

async function getArticleBookmarkCounts(slugs: string[]) {
  if (slugs.length === 0) {
    return new Map<string, number>();
  }

  const groups = await prisma.bookmark.groupBy({
    by: ["articleSlug"],
    where: {
      type: "article",
      articleSlug: { in: slugs },
    },
    _count: { _all: true },
  });

  return new Map(
    groups
      .filter((group) => group.articleSlug)
      .map((group) => [group.articleSlug as string, group._count._all]),
  );
}

async function getVideoBookmarkCounts(videoIds: string[]) {
  if (videoIds.length === 0) {
    return new Map<string, number>();
  }

  const groups = await prisma.bookmark.groupBy({
    by: ["videoId"],
    where: {
      type: "video",
      videoId: { in: videoIds },
    },
    _count: { _all: true },
  });

  return new Map(
    groups
      .filter((group) => group.videoId)
      .map((group) => [group.videoId as string, group._count._all]),
  );
}

export function getDiscoveryCategories(preferredCategories: string[] = []) {
  const categories = preferredCategories.length > 0 ? preferredCategories : [DEFAULT_CATEGORY];
  return uniqueBy(categories, (category) => category).slice(0, 3) as Category[];
}

export function mixPersonalizedArticles(
  preferredArticles: NewsArticle[],
  generalArticles: NewsArticle[],
  preferredCategories: Category[],
  limit: number,
) {
  const preferredSet = new Set(preferredCategories);
  const ranked = uniqueBy([...preferredArticles, ...generalArticles], (article) => article.url).sort(
    (a, b) => {
      const categoryDifference =
        Number(preferredSet.has(getArticleCategory(b))) -
        Number(preferredSet.has(getArticleCategory(a)));

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt);
    },
  );

  return ranked.slice(0, limit);
}

export function mixPersonalizedVideos(
  preferredVideos: Video[],
  generalVideos: Video[],
  preferredCategories: Category[],
  limit: number,
) {
  const preferredSet = new Set(preferredCategories);
  const ranked = uniqueBy([...preferredVideos, ...generalVideos], (video) => video.videoId).sort(
    (a, b) => {
      const categoryDifference =
        Number(preferredSet.has(getVideoCategory(b))) -
        Number(preferredSet.has(getVideoCategory(a)));

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt);
    },
  );

  return ranked.slice(0, limit);
}

export async function rankTrendingArticles(
  articles: NewsArticle[],
  preferredCategories: Category[],
  limit: number,
) {
  const preferredSet = new Set(preferredCategories);
  const slugByUrl = new Map<string, string>();
  const persistedArticles = await prisma.article.findMany({
    where: { url: { in: articles.map((article) => article.url).filter(Boolean) } },
    select: { url: true, slug: true },
  });

  for (const article of persistedArticles) {
    slugByUrl.set(article.url, article.slug);
  }

  const bookmarkCounts = await getArticleBookmarkCounts(Array.from(slugByUrl.values()));

  return uniqueBy(articles, (article) => article.url)
    .sort((a, b) => {
      const aBookmarkCount = bookmarkCounts.get(slugByUrl.get(a.url) ?? "") ?? 0;
      const bBookmarkCount = bookmarkCounts.get(slugByUrl.get(b.url) ?? "") ?? 0;
      const aCategoryBoost = preferredSet.has(getArticleCategory(a)) ? 2 : 0;
      const bCategoryBoost = preferredSet.has(getArticleCategory(b)) ? 2 : 0;
      const aScore = aBookmarkCount * 4 + aCategoryBoost + toTimestamp(a.publishedAt) / 1_000_000_000_000;
      const bScore = bBookmarkCount * 4 + bCategoryBoost + toTimestamp(b.publishedAt) / 1_000_000_000_000;

      return bScore - aScore;
    })
    .slice(0, limit);
}

export async function rankTrendingVideos(
  videos: Video[],
  preferredCategories: Category[],
  limit: number,
) {
  const preferredSet = new Set(preferredCategories);
  const bookmarkCounts = await getVideoBookmarkCounts(videos.map((video) => video.videoId));

  return uniqueBy(videos, (video) => video.videoId)
    .sort((a, b) => {
      const aBookmarkCount = bookmarkCounts.get(a.videoId) ?? 0;
      const bBookmarkCount = bookmarkCounts.get(b.videoId) ?? 0;
      const aCategoryBoost = preferredSet.has(getVideoCategory(a)) ? 2 : 0;
      const bCategoryBoost = preferredSet.has(getVideoCategory(b)) ? 2 : 0;
      const aScore = aBookmarkCount * 4 + aCategoryBoost + toTimestamp(a.publishedAt) / 1_000_000_000_000;
      const bScore = bBookmarkCount * 4 + bCategoryBoost + toTimestamp(b.publishedAt) / 1_000_000_000_000;

      return bScore - aScore;
    })
    .slice(0, limit);
}

export async function buildTrendingDiscoveryItems(
  articles: NewsArticle[],
  videos: Video[],
  preferredCategories: Category[],
  limit: number,
): Promise<DiscoveryItem[]> {
  const [rankedArticles, rankedVideos] = await Promise.all([
    rankTrendingArticles(articles, preferredCategories, limit),
    rankTrendingVideos(videos, preferredCategories, limit),
  ]);
  const items: DiscoveryItem[] = [];
  const maxLength = Math.max(rankedArticles.length, rankedVideos.length);

  for (let index = 0; index < maxLength; index += 1) {
    const article = rankedArticles[index];
    const video = rankedVideos[index];

    if (article) {
      items.push({
        id: `article:${article.url}`,
        kind: "article",
        title: article.title,
        description: article.description,
        image: article.image,
        source: article.source ?? "News",
        category: getArticleCategory(article),
        publishedAt: article.publishedAt,
        popularityScore: normalizeScore(96 - index * 6),
        article,
      });
    }

    if (video) {
      items.push({
        id: `video:${video.videoId}`,
        kind: "video",
        title: video.title,
        description: video.description,
        image: video.thumbnail,
        source: video.channel,
        category: getVideoCategory(video),
        publishedAt: video.publishedAt,
        popularityScore: normalizeScore(93 - index * 6),
        video,
      });
    }
  }

  return items.slice(0, limit);
}
