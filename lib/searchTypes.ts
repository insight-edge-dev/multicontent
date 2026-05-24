import type { Video } from "@/components/VideoCard";
import type { Category } from "@/lib/categoryTypes";
import type { NewsArticle } from "@/lib/newsTypes";

export type SearchContentType = "article" | "video";

export interface SearchFilters {
  query: string;
  category?: Category | "All";
}

export interface ArticleSearchResult extends NewsArticle {
  slug: string;
  bookmarkCount: number;
}

export interface VideoSearchResult extends Video {
  category: Category;
  bookmarkCount: number;
}

export interface SearchResponse {
  articles: ArticleSearchResult[];
  videos: VideoSearchResult[];
  total: number;
  query: string;
  category: Category | "All";
  error?: string;
}
