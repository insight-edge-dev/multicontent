import Link from "next/link";
import type { DiscoveryItem } from "@/lib/discoveryTypes";

type HomeHeroProps = {
  label: string;
  articleCount: number;
  videoCount: number;
  trendingItems: DiscoveryItem[];
};

export function HomeHero({ label, articleCount, videoCount, trendingItems }: HomeHeroProps) {
  const badges = trendingItems.slice(0, 4);

  return (
    <section className="glass-panel relative overflow-hidden rounded-[1.75rem] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-home-noise opacity-35" />
      <div className="pointer-events-none absolute inset-0 animate-aura bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.24),transparent_34%),radial-gradient(circle_at_88%_24%,rgba(99,102,241,0.18),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_40%)]" />

      <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-6 flex flex-wrap gap-2.5">
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-2 text-sm font-semibold text-cyan-100">
              {label}
            </span>
            <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-2 text-sm font-semibold text-emerald-100">
              Live discovery graph
            </span>
          </div>

          <h1 className="max-w-5xl font-heading text-[clamp(3rem,12vw,4.8rem)] font-semibold leading-[0.94] tracking-tight text-white lg:text-[clamp(4.6rem,7vw,6.2rem)]">
            <span className="block animate-hero-rise">Discover what</span>
            <span className="block animate-hero-rise-delayed bg-gradient-to-r from-cyan-200 via-white to-indigo-200 bg-clip-text text-transparent">
              matters next.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-xl sm:leading-9">
            A personalized media command center blending breaking articles, high-signal videos, saved-item momentum, and category intelligence.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="rounded-2xl bg-cyan-300 px-5 py-3.5 text-center text-sm font-bold text-ink-950 shadow-[0_0_34px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Start discovering
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.08]"
            >
              Tune preferences
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Articles", articleCount],
              ["Videos", videoCount],
              ["Signals", trendingItems.length],
            ].map(([name, value]) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-sm font-medium text-slate-400">{name}</p>
                <p className="mt-2 font-heading text-3xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[24rem] sm:min-h-[28rem]">
          <div className="absolute inset-0 rounded-[2rem] border border-cyan-300/10 bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,0.24),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_38%),rgba(2,6,23,0.78)] shadow-[0_0_80px_rgba(34,211,238,0.12)]" />
          <div className="relative grid h-full gap-3 p-3 sm:p-4">
            {badges.map((item, index) => (
              <Link
                key={item.id}
                href={item.kind === "article" ? `/search?q=${encodeURIComponent(item.title)}` : `/videos/${item.video.videoId}`}
                className={`rounded-2xl border border-white/10 bg-white/[0.075] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.1] ${
                  index === 1 ? "sm:ml-8" : index === 2 ? "sm:mr-8" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">
                    {item.kind}
                  </span>
                  <span className="text-xs font-semibold text-emerald-200">
                    {item.popularityScore} pulse
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-white">
                  {item.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {item.category} / {item.source}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
