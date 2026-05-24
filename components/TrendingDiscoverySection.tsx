import Link from "next/link";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { DiscoveryItem } from "@/lib/discoveryTypes";

type TrendingDiscoverySectionProps = {
  items: DiscoveryItem[];
};

export function TrendingDiscoverySection({ items }: TrendingDiscoverySectionProps) {
  const [featured, ...rest] = items;

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Trending Today"
          title="The discovery board"
          description="A mixed stream of articles and videos ranked by recency, category fit, and saved-item momentum."
        />
        <Link href="/search?q=trending" className="text-sm font-semibold text-cyan-300 transition hover:text-white">
          Explore trends
        </Link>
      </div>

      {featured ? <DiscoveryCard item={featured} featured /> : null}

      {rest.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item) => (
            <DiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
