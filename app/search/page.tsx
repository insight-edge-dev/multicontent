import { Suspense } from "react";
import { Container } from "@/components/Container";
import { SearchExperience } from "@/components/SearchExperience";
import { SectionHeading } from "@/components/SectionHeading";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <SectionHeading
          eyebrow="Discovery"
          title="Search everything"
          description="Find articles and videos by title, description, source, or category."
        />

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
                Loading search...
              </div>
            }
          >
            <SearchExperience />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
