"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { isRenderableImageSrc } from "@/lib/imageUtils";
import { createArticleSlug } from "@/lib/newsSlug";
import type { DiscoveryItem } from "@/lib/discoveryTypes";

type DiscoveryCardProps = {
  item: DiscoveryItem;
  featured?: boolean;
};

function formatPublishedAt(value?: string) {
  if (!value) {
    return "Live";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Live";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function DiscoveryCard({ item, featured = false }: DiscoveryCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const articleSlug = item.kind === "article" ? createArticleSlug(item.article) : "";
  const href = item.kind === "article" ? `/news/${articleSlug}` : `/videos/${item.video.videoId}`;
  const imageSrc = item.image?.trim() ?? "";
  const shouldShowImage = isRenderableImageSrc(imageSrc) && !hasImageError;

  return (
    <article
      className={`cinematic-hover group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_20px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-cyan-300/40 hover:bg-white/[0.07] ${
        featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""
      }`}
    >
      <BookmarkButton
        bookmark={
          item.kind === "article"
            ? {
                type: "article",
                articleSlug,
                title: item.title,
                image: item.image,
                source: item.source,
              }
            : {
                type: "video",
                videoId: item.video.videoId,
                title: item.title,
                image: item.image,
                source: item.source,
              }
        }
        className="absolute right-3 top-3 z-20"
      />

      <Link href={href} className={featured ? "contents" : "block h-full"}>
        <div className={`relative bg-slate-950 ${featured ? "min-h-72 lg:min-h-full" : "aspect-[16/10]"}`}>
          {shouldShowImage ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes={featured ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
              className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.055] group-hover:opacity-100"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.24),transparent_32%),linear-gradient(135deg,#020617,#0f172a)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
          {item.kind === "video" ? (
            <span className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-white text-xs font-black text-ink-950 shadow-xl transition duration-300 group-hover:scale-110">
              Play
            </span>
          ) : null}
        </div>

        <div className={`space-y-4 p-5 sm:p-6 ${featured ? "sm:p-8" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
              {item.kind}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
              {item.category}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              {item.popularityScore} score
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {item.source} / {formatPublishedAt(item.publishedAt)}
            </p>
            <h3
              className={`mt-3 font-semibold leading-tight tracking-tight text-white ${
                featured ? "text-3xl sm:text-4xl lg:text-5xl" : "line-clamp-2 text-xl"
              }`}
            >
              {item.title}
            </h3>
          </div>

          <p className={`text-sm leading-6 text-slate-300 ${featured ? "sm:text-base sm:leading-7" : "line-clamp-3"}`}>
            {item.description || "A fast-moving signal from the MultiContent discovery graph."}
          </p>
        </div>
      </Link>
    </article>
  );
}
