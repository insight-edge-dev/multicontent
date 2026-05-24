"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { NewsCard } from "@/components/NewsCard";
import { VideoCard } from "@/components/VideoCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SUPPORTED_CATEGORIES, isCategory, type Category } from "@/lib/categoryTypes";
import type { SearchResponse } from "@/lib/searchTypes";

type SearchCategory = Category | "All";

const SEARCH_CATEGORIES: readonly SearchCategory[] = ["All", ...SUPPORTED_CATEGORIES];

function getInitialCategory(value: string | null): SearchCategory {
  if (!value || value === "All") {
    return "All";
  }

  return isCategory(value) ? value : "All";
}

export function SearchExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<SearchCategory>(
    getInitialCategory(searchParams.get("category")),
  );
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    if (category !== "All") {
      params.set("category", category);
    }

    return `/api/search?${params.toString()}`;
  }, [category, debouncedQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    if (category !== "All") {
      params.set("category", category);
    }

    router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }, [category, debouncedQuery, router]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");

    fetch(searchUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Search failed");
        }

        return response.json() as Promise<SearchResponse>;
      })
      .then(setResults)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage("Unable to search right now.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [searchUrl]);

  return (
    <section>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-glow sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Global Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, descriptions, categories, sources..."
            className="mt-4 h-12 w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-slate-950"
          />
        </label>

        <CategoryTabs
          categories={SEARCH_CATEGORIES}
          activeCategory={category}
          onCategoryChange={setCategory}
          className="mt-5"
        />
      </div>

      <div className="mt-6 min-h-6">
        {isLoading ? (
          <p className="text-sm font-semibold text-cyan-200">Searching the discovery index...</p>
        ) : errorMessage ? (
          <p className="text-sm font-semibold text-red-200">{errorMessage}</p>
        ) : (
          <p className="text-sm text-slate-400">
            {results ? `${results.total} results found` : "Start typing to search MultiContent."}
          </p>
        )}
      </div>

      <div className={`mt-8 space-y-14 transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}>
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Articles
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Matching news
              </h2>
            </div>
            <span className="text-sm text-slate-400">{results?.articles.length ?? 0}</span>
          </div>

          {results?.articles.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.articles.map((article) => (
                <NewsCard key={article.url} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
              No article matches yet.
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Videos
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Matching videos
              </h2>
            </div>
            <span className="text-sm text-slate-400">{results?.videos.length ?? 0}</span>
          </div>

          {results?.videos.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.videos.map((video) => (
                <VideoCard key={video.videoId} video={video} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
              No video matches yet.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
