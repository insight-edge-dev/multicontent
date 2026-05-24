"use client";

import { useState } from "react";
import type { BookmarkRequest } from "@/lib/bookmarkTypes";
import { useBookmarks } from "@/hooks/useBookmarks";

type BookmarkButtonProps = {
  bookmark: BookmarkRequest;
  className?: string;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
    >
      <path
        d="M6.5 4.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v15l-5.5-3.2-5.5 3.2v-15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function BookmarkButton({ bookmark, className = "" }: BookmarkButtonProps) {
  const { getBookmark, saveBookmark, removeBookmark } = useBookmarks();
  const [isMutating, setIsMutating] = useState(false);
  const savedBookmark = getBookmark(bookmark);
  const isSaved = Boolean(savedBookmark);

  async function handleClick() {
    if (isMutating) {
      return;
    }

    setIsMutating(true);

    try {
      if (savedBookmark) {
        await removeBookmark(savedBookmark.id);
      } else {
        await saveBookmark(bookmark);
      }
    } catch {
      // The hook restores optimistic state and exposes a failure message.
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove bookmark" : "Save bookmark"}
      title={isSaved ? "Remove bookmark" : "Save bookmark"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleClick();
      }}
      disabled={isMutating}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/82 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.16)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300 hover:text-slate-950 disabled:cursor-wait disabled:opacity-80 ${className}`}
    >
      {isMutating ? <Spinner /> : <BookmarkIcon filled={isSaved} />}
    </button>
  );
}
