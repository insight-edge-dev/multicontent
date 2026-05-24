"use client";

import { useEffect, useRef, useState } from "react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import type { Category } from "@/lib/categoryTypes";
import type { DiscoveryFeedResponse, DiscoveryItem } from "@/lib/discoveryTypes";

type InfiniteDiscoveryFeedProps = {
  initialItems: DiscoveryItem[];
  initialPage?: number;
  category?: Category;
};

function FeedSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <div className="h-36 rounded-xl bg-white/[0.06]" />
          <div className="mt-5 h-4 w-28 rounded-full bg-white/[0.08]" />
          <div className="mt-4 h-5 w-4/5 rounded-full bg-white/[0.08]" />
          <div className="mt-3 h-4 w-full rounded-full bg-white/[0.06]" />
          <div className="mt-2 h-4 w-2/3 rounded-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export function InfiniteDiscoveryFeed({
  initialItems,
  initialPage = 1,
  category,
}: InfiniteDiscoveryFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState<number | null>(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || nextPage === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible || isLoading || nextPage === null) {
          return;
        }

        setIsLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams({
          page: String(nextPage),
          limit: "6",
        });

        if (category) {
          params.set("category", category);
        }

        fetch(`/api/discovery/feed?${params.toString()}`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to load feed");
            }

            return response.json() as Promise<DiscoveryFeedResponse>;
          })
          .then((data) => {
            setItems((current) => {
              const existingIds = new Set(current.map((item) => item.id));
              const nextItems = data.items.filter((item) => !existingIds.has(item.id));
              return [...current, ...nextItems];
            });
            setNextPage(data.nextPage);
          })
          .catch(() => {
            setErrorMessage("Unable to load more discovery items right now.");
          })
          .finally(() => setIsLoading(false));
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [category, isLoading, nextPage]);

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Infinite Feed
        </p>
        <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Keep exploring
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:leading-8">
          A lazy-loaded stream that keeps mixing personalized news and video signals as you scroll.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DiscoveryCard key={item.id} item={item} />
        ))}
      </div>

      <div ref={sentinelRef} className="mt-8 min-h-12">
        {isLoading ? <FeedSkeleton /> : null}
        {errorMessage ? (
          <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}
        {!isLoading && nextPage === null ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm font-medium text-slate-400">
            You are caught up for now.
          </p>
        ) : null}
      </div>
    </section>
  );
}
