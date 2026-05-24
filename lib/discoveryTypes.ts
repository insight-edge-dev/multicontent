import type { Video } from "@/components/VideoCard";
import type { Category } from "@/lib/categoryTypes";
import type { NewsArticle } from "@/lib/newsTypes";

export type DiscoveryItem =
  | {
      id: string;
      kind: "article";
      title: string;
      description: string;
      image: string | null;
      source: string;
      category: Category;
      publishedAt?: string;
      popularityScore: number;
      article: NewsArticle;
    }
  | {
      id: string;
      kind: "video";
      title: string;
      description: string;
      image: string;
      source: string;
      category: Category;
      publishedAt?: string;
      popularityScore: number;
      video: Video;
    };

export interface DiscoveryFeedResponse {
  items: DiscoveryItem[];
  nextPage: number | null;
  error?: string;
}
