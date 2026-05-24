"use client";

import { useState } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import type { Category } from "@/lib/categoryTypes";
import { NewsCard } from "@/components/NewsCard";
import type { NewsArticle, NewsResponse } from "@/lib/newsTypes";
import { limitNewsArticles } from "@/lib/newsUtils";

type CategoryNewsFeedProps = {
  initialArticles: NewsArticle[];
  initialCategory?: Category;
  className?: string;
  limit?: number;
};

async function fetchCategoryNews(category: Category) {
  const response = await fetch(`/api/aggregate/news?q=${encodeURIComponent(category)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch category news");
  }

  const data = (await response.json()) as NewsResponse;
  return data.articles ?? [];
}

export function CategoryNewsFeed({
  initialArticles,
  initialCategory = "Technology",
  className = "mt-10",
  limit,
}: CategoryNewsFeedProps) {
  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory);
  const [articles, setArticles] = useState(() => limitNewsArticles(initialArticles, limit));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCategoryChange(category: Category) {
    if (category === activeCategory || isLoading) {
      return;
    }

    setActiveCategory(category);
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextArticles = await fetchCategoryNews(category);
      setArticles(limitNewsArticles(nextArticles, limit));
    } catch {
      setErrorMessage("Unable to load this category right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={className}>
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        disabled={isLoading}
      />

      <div className="mt-4 min-h-6">
        {isLoading ? (
          <p className="text-sm font-medium text-cyan-200">Loading {activeCategory} news...</p>
        ) : errorMessage ? (
          <p className="text-sm font-medium text-red-200">{errorMessage}</p>
        ) : null}
      </div>

      <div
        className={`mt-6 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
      >
        {articles.map((article) => (
          <NewsCard key={article.url} article={article} />
        ))}
      </div>
    </section>
  );
}
