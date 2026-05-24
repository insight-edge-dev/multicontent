"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SearchResponse } from "@/lib/searchTypes";

type NavbarSearchProps = {
  className?: string;
  initiallyExpanded?: boolean;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="m15.5 15.5 4 4M10.75 17.5a6.75 6.75 0 1 1 0-13.5 6.75 6.75 0 0 1 0 13.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function NavbarSearch({ className = "", initiallyExpanded = false }: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const debouncedQuery = useDebouncedValue(query, 250);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldShowPanel = isExpanded && isFocused && query.trim().length >= 2;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
        if (!initiallyExpanded && !query.trim()) {
          setIsExpanded(false);
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [initiallyExpanded, query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA";

      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      setIsExpanded(true);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
      signal: controller.signal,
    })
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

        setResults(null);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return;
    }

    setIsFocused(false);
    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  }

  function expandSearch() {
    setIsExpanded(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  const suggestions = [
    ...(results?.articles.slice(0, 3).map((article) => ({
      href: `/news/${article.slug}`,
      title: article.title,
      label: article.source ?? "Article",
    })) ?? []),
    ...(results?.videos.slice(0, 2).map((video) => ({
      href: `/videos/${video.videoId}`,
      title: video.title,
      label: video.channel,
    })) ?? []),
  ];

  return (
    <div ref={wrapperRef} className={`relative w-full max-w-xs ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`relative flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 focus-within:border-cyan-300/50 focus-within:bg-white/[0.08] ${
          isExpanded ? "w-full sm:w-80" : "w-10"
        }`}
      >
        <button
          type="button"
          aria-label="Open search"
          onClick={expandSearch}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition hover:text-white"
        >
          <SearchIcon />
        </button>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            setIsExpanded(true);
            setIsFocused(true);
          }}
          placeholder="Search articles and videos"
          className={`h-full min-w-0 flex-1 bg-transparent pr-16 text-sm text-white outline-none transition placeholder:text-slate-500 ${
            isExpanded ? "opacity-100" : "pointer-events-none w-0 opacity-0"
          }`}
        />

        <span
          className={`pointer-events-none absolute right-2 hidden rounded-md border border-white/10 bg-slate-950/70 px-1.5 py-1 text-[10px] font-bold text-slate-500 transition sm:block ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          /
        </span>
      </form>

      {shouldShowPanel ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-ink-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_36px_rgba(34,211,238,0.12)] backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            {isLoading ? "Searching..." : `${results?.total ?? 0} results`}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {isLoading ? (
              <div className="rounded-md bg-white/[0.04] px-3 py-4 text-sm text-slate-300">
                Matching fresh content...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <Link
                  key={`${suggestion.href}-${suggestion.title}`}
                  href={suggestion.href}
                  onClick={() => setIsFocused(false)}
                  className="block rounded-md px-3 py-3 transition hover:bg-white/[0.08]"
                >
                  <p className="line-clamp-1 text-sm font-semibold text-white">
                    {suggestion.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{suggestion.label}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-md bg-white/[0.04] px-3 py-4 text-sm text-slate-300">
                No quick matches yet. Press Enter for a full search.
              </div>
            )}
          </div>

          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setIsFocused(false)}
            className="block border-t border-white/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-white/[0.06] hover:text-white"
          >
            Open full search
          </Link>
        </div>
      ) : null}
    </div>
  );
}
