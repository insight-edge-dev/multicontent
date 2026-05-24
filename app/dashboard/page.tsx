"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Container } from "@/components/Container";
import type { Bookmark } from "@/lib/bookmarkTypes";
import { SUPPORTED_CATEGORIES, inferCategoryFromText, type Category } from "@/lib/categoryTypes";
import { useBookmarks } from "@/hooks/useBookmarks";

type TokenPayload = {
  email?: string;
  exp?: number;
};

const sidebarItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/news", label: "News" },
  { href: "/videos", label: "Videos" },
];

type SavedCategory = Category | "All";
type SavedSort = "newest" | "oldest" | "title" | "source";

const savedCategories: readonly SavedCategory[] = ["All", ...SUPPORTED_CATEGORIES];

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

function formatSavedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently saved";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getBookmarkHref(bookmark: Bookmark) {
  if (bookmark.type === "article" && bookmark.articleSlug) {
    return `/news/${bookmark.articleSlug}`;
  }

  if (bookmark.type === "video" && bookmark.videoId) {
    return `/videos/${bookmark.videoId}`;
  }

  return "#";
}

function getBookmarkCategory(bookmark: Bookmark) {
  return inferCategoryFromText(bookmark.title, bookmark.source);
}

function filterAndSortBookmarks(
  bookmarks: Bookmark[],
  query: string,
  category: SavedCategory,
  sort: SavedSort,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return bookmarks
    .filter((bookmark) => {
      const bookmarkCategory = getBookmarkCategory(bookmark);
      const matchesCategory = category === "All" || bookmarkCategory === category;
      const matchesQuery =
        !normalizedQuery ||
        [bookmark.title, bookmark.source, bookmarkCategory]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (a.title ?? "").localeCompare(b.title ?? "");
      }

      if (sort === "source") {
        return (a.source ?? "").localeCompare(b.source ?? "");
      }

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });
}

function SavedItemCard({ bookmark }: { bookmark: Bookmark }) {
  const href = getBookmarkHref(bookmark);
  const hasImage = Boolean(bookmark.image?.trim());

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-ink-900 transition hover:border-cyan-300/40 hover:bg-white/[0.06]">
      <div className="relative aspect-video bg-slate-900">
        {hasImage ? (
          <Image
            src={bookmark.image ?? ""}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-90"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">
            No image
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
          {bookmark.source ? <span>{bookmark.source}</span> : null}
          <span className="text-slate-600">/</span>
          <time>{formatSavedAt(bookmark.createdAt)}</time>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-white">
          {bookmark.title ?? "Saved item"}
        </h3>

        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300 hover:text-slate-950"
        >
          Open
        </Link>
      </div>
    </article>
  );
}

function SavedSection({
  title,
  description,
  bookmarks,
  isLoading,
}: {
  title: string;
  description: string;
  bookmarks: Bookmark[];
  isLoading: boolean;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-glow sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Saved
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <span className="text-sm font-medium text-slate-400">
          {bookmarks.length} saved
        </span>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
          Loading saved items...
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <SavedItemCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-5 text-sm leading-6 text-slate-300">
          Nothing saved here yet. Use the bookmark button on stories and videos to build your library.
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [savedQuery, setSavedQuery] = useState("");
  const [savedCategory, setSavedCategory] = useState<SavedCategory>("All");
  const [savedSort, setSavedSort] = useState<SavedSort>("newest");
  const { bookmarks, isLoading: isLoadingBookmarks, error: bookmarkError } = useBookmarks();
  const visibleBookmarks = useMemo(
    () => filterAndSortBookmarks(bookmarks, savedQuery, savedCategory, savedSort),
    [bookmarks, savedCategory, savedQuery, savedSort],
  );
  const savedArticles = visibleBookmarks.filter((bookmark) => bookmark.type === "article");
  const savedVideos = visibleBookmarks.filter((bookmark) => bookmark.type === "video");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeToken(token);
    const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : false;

    if (!payload?.email || isExpired) {
      localStorage.removeItem("token");
      router.replace("/login");
      return;
    }

    setEmail(payload.email);
    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth) {
    return (
      <Container className="py-12">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
          Checking your session...
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-glow">
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Dashboard
            </p>
            <p className="mt-2 truncate text-sm text-slate-300">{email}</p>
          </div>

          <nav className="mt-4 grid gap-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-glow sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Welcome
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Good to see you.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              You are signed in as <span className="font-semibold text-white">{email}</span>.
              Use this workspace to jump into your live news and video feeds.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/news"
              className="rounded-lg border border-white/10 bg-ink-900 p-5 transition hover:border-cyan-300/40 hover:bg-white/[0.06]"
            >
              <p className="text-sm font-medium text-slate-400">Live endpoint</p>
              <h2 className="mt-2 text-xl font-semibold text-white">News feed</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Review current headlines from your news aggregation source.
              </p>
            </Link>

            <Link
              href="/videos"
              className="rounded-lg border border-white/10 bg-ink-900 p-5 transition hover:border-cyan-300/40 hover:bg-white/[0.06]"
            >
              <p className="text-sm font-medium text-slate-400">Live endpoint</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Video feed</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Explore relevant video results from your content pipeline.
              </p>
            </Link>
          </div>

          {bookmarkError ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {bookmarkError}
            </div>
          ) : null}

          <section
            id="saved"
            className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-glow sm:p-6"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-end">
              <label className="block">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Saved Search
                </span>
                <input
                  type="search"
                  value={savedQuery}
                  onChange={(event) => setSavedQuery(event.target.value)}
                  placeholder="Filter saved titles and sources"
                  className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Sort
                </span>
                <select
                  value={savedSort}
                  onChange={(event) => setSavedSort(event.target.value as SavedSort)}
                  className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                  <option value="source">Source</option>
                </select>
              </label>
            </div>

            <CategoryTabs
              categories={savedCategories}
              activeCategory={savedCategory}
              onCategoryChange={setSavedCategory}
              className="mt-5"
            />
          </section>

          <SavedSection
            title="Saved Articles"
            description="Permanent article shortcuts from your news feed."
            bookmarks={savedArticles}
            isLoading={isLoadingBookmarks}
          />

          <SavedSection
            title="Saved Videos"
            description="Video picks saved from your curated watch feed."
            bookmarks={savedVideos}
            isLoading={isLoadingBookmarks}
          />
        </section>
      </div>
    </Container>
  );
}
