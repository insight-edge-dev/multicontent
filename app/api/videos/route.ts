import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const CACHE_TTL = 60;

interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { high: { url: string } };
    publishedAt: string;
    channelTitle: string;
  };
}

interface NormalizedVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channel: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "technology";
    const maxResults = Math.min(Number(searchParams.get("maxResults") ?? "10"), 50);

    if (!process.env.YOUTUBE_API_BASE_URL || !process.env.YOUTUBE_API_KEY) {
      console.warn("[GET /api/videos] Missing YouTube configuration");
      return NextResponse.json({ videos: [], items: [], total: 0 });
    }

    const cacheKey = `videos:${query}:${maxResults}`;
    const cached = cache.get<NormalizedVideo[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ videos: cached, items: cached, total: cached.length, cached: true });
    }

    const url = new URL(`${process.env.YOUTUBE_API_BASE_URL}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });

    if (!res.ok) {
      const err = await res.json();
      console.error("[GET /api/videos] YouTube API error:", err);
      return NextResponse.json({ videos: [], items: [], total: 0 });
    }

    const data = await res.json();
    const videos: NormalizedVideo[] = (data.items as YouTubeItem[]).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
      channel: item.snippet.channelTitle,
    }));

    cache.set(cacheKey, videos, CACHE_TTL);

    return NextResponse.json({ videos, items: videos, total: videos.length, cached: false });
  } catch (err) {
    console.error("[GET /api/videos]", err);
    return NextResponse.json({ videos: [], items: [], total: 0 });
  }
}
