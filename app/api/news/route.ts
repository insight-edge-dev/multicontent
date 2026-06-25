import { NextRequest, NextResponse } from "next/server";
import { fetchGNewsArticles, GNewsFetchError } from "@/services/news/gnewsService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "technology";
    const result = await fetchGNewsArticles(query);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/news]", err);
    if (err instanceof GNewsFetchError) {
      return NextResponse.json({ error: "Failed to fetch news" }, { status: err.status });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
