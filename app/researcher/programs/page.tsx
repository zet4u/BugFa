import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { SearchFilters } from "@/components/app/search-filters";
import { ProgramCard } from "@/components/app/program-card";
import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { SearchX } from "lucide-react";
import { PAGE_SIZE } from "@/lib/constants";
import { formatPoints } from "@/lib/utils";

export const metadata: Metadata = { title: "برنامه‌های موجود" };

export default async function ResearcherProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const q = params.q?.slice(0, 100).trim() ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "_default";

  const where = {
    status: "PUBLIC" as const,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(category ? { categories: { has: category } } : {}),
  };
  const orderBy: any =
    sort === "bounty" ? [{ maxBounty: "desc" }] : sort === "name" ? [{ title: "asc" }] : [{ featured: "desc" }, { publishedAt: "desc" }];

  const [total, programs] = await Promise.all([
    prisma.program.count({ where }),
    prisma.program.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { organization: { select: { name: true, slug: true, verified: true, logoUrl: true } } },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardShell title="برنامه‌های موجود" subtitle={`${formatPoints(total)} برنامه عمومی`} nav={RESEARCHER_NAV} currentPath="/researcher/programs">
      <Suspense fallback={null}>
        <SearchFilters basePath="/researcher/programs" />
      </Suspense>
      <div className="mt-6">
        {programs.length === 0 ? (
          <EmptyState icon={<SearchX />} title="برنامه‌ای یافت نشد" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program as any} />
            ))}
          </div>
        )}
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} basePath="/researcher/programs" searchParams={params as any} />
        </div>
      </div>
    </DashboardShell>
  );
}
