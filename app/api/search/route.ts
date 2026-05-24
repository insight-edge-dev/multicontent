import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/content";
import { inferCategoryFromText, isCategory, type Category } from "@/lib/categoryTypes";
import { prisma } from "@/lib/prisma";
import type { SearchResponse, VideoSearchResult } from "@/lib/searchTypes";

export const dynamic = "force-dynamic";

type ArticleRow = {
  slug: string;
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
  category: string;
  type: string;
  publishedAt: Date | null;
};

function toArticleSearchResult(article: ArticleRow, bookmarkCount: number) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    image: article.image,
    url: article.url,
    source: article.source,
    category: article.category,
    type: article.type === "scraped" ? "scraped" as const : "api" as const,
    publishedAt: article.publishedAt?.toISOString(),
    bookmarkCount,
  };
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

function getVideoCategory(video: { title: string; description: string; channel: string }) {
  return inferCategoryFromText(video.title, video.description, video.channel);
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const categoryParam = searchParams.get("category") ?? "All";
    const category: Category | "All" = isCategory(categoryParam) ? categoryParam : "All";
    const articleWhere = {
      AND: [
        category === "All" ? {} : { category },
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { category: { contains: query, mode: "insensitive" as const } },
                { source: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const articles = await prisma.article.findMany({
      where: articleWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 18,
    });
    const articleBookmarkCounts = await getArticleBookmarkCounts(articles.map((article) => article.slug));
    const videoQuery = query || (category === "All" ? "technology" : category);
    const videos = await getVideos(videoQuery, 12).catch(() => []);
    const videoBookmarkCounts = await getVideoBookmarkCounts(videos.map((video) => video.videoId));
    const videoResults: VideoSearchResult[] = videos
      .map((video) => ({
        ...video,
        category: getVideoCategory(video),
        bookmarkCount: videoBookmarkCounts.get(video.videoId) ?? 0,
      }))
      .filter((video) => category === "All" || video.category === category)
      .filter((video) =>
        matchesQuery([video.title, video.description, video.channel, video.category], query),
      )
      .slice(0, 12);

    const response: SearchResponse = {
      articles: articles.map((article) =>
        toArticleSearchResult(article, articleBookmarkCounts.get(article.slug) ?? 0),
      ),
      videos: videoResults,
      total: articles.length + videoResults.length,
      query,
      category,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { articles: [], videos: [], total: 0, query: "", category: "All", error: "Search failed" },
      { status: 500 },
    );
  }
}
