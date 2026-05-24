import { NextRequest, NextResponse } from "next/server";
import { getNews, getVideos } from "@/lib/content";
import { DEFAULT_CATEGORY, SUPPORTED_CATEGORIES, isCategory } from "@/lib/categoryTypes";
import type { DiscoveryFeedResponse } from "@/lib/discoveryTypes";
import {
  buildTrendingDiscoveryItems,
  getDiscoveryCategories,
} from "@/services/discovery/personalization";

export const dynamic = "force-dynamic";

function getCategoryForPage(page: number, category?: string | null) {
  if (category && isCategory(category)) {
    return category;
  }

  return SUPPORTED_CATEGORIES[page % SUPPORTED_CATEGORIES.length] ?? DEFAULT_CATEGORY;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, Number(searchParams.get("page") ?? "0"));
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "8"), 4), 12);
    const category = getCategoryForPage(page, searchParams.get("category"));
    const discoveryCategories = getDiscoveryCategories([category]);
    const [articles, videos] = await Promise.all([
      getNews(category, limit + 4),
      getVideos(category, limit + 4),
    ]);
    const items = await buildTrendingDiscoveryItems(
      articles,
      videos,
      discoveryCategories,
      limit,
    );
    const response: DiscoveryFeedResponse = {
      items,
      nextPage: items.length > 0 && page < 5 ? page + 1 : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/discovery/feed]", error);
    return NextResponse.json(
      { items: [], nextPage: null, error: "Failed to load discovery feed" },
      { status: 500 },
    );
  }
}
