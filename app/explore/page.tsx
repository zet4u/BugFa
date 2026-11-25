import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SearchX } from "lucide-react";
import { ProgramCard } from "@/components/app/program-card";
import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { SearchFilters } from "@/components/app/search-filters";
import { PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Explore Programs" };

const SORTS: Record<string, object> = {
  _default: [{ publishedAt: "desc" }],
  bounty: [{ maxBounty: "desc" }],
  name: [{ title: "asc" }],
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const q = params.q?.slice(0, 100).trim() ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "_default";

  const where = {
    status: { in: ["PUBLIC", "PAUSED"] as any },
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { summary: { contains: q, mode: "insensitive" as const } }, { organization: { name: { contains: q, mode: "insensitive" as const } } }] } : {}),
    ...(category ? { categories: { has: category } } : {}),
  };

  const orderBy = SORTS[sort] ?? SORTS._default;
  const [total, programs] = await Promise.all([
    prisma.program.count({ where }),
    prisma.program.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { organization: { select: { name: true, slug: true, verified: true, logoUrl: true } } },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold tracking-tight">Explore programs</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        {total} program{total === 1 ? "" : "s"} accepting coordinated vulnerability reports.
      </p>
      <Suspense fallback={null}>
        <SearchFilters basePath="/explore" />
      </Suspense>
      <div className="mt-8">
        {programs.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="No programs match"
            description="Try different keywords or clear the filters."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program as any} />
            ))}
          </div>
        )}
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} basePath="/explore" searchParams={params as any} />
        </div>
      </div>
    </div>
  );
}
