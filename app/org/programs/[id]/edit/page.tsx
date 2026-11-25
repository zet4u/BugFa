import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { BackLink } from "@/components/app/back-link";
import { ProgramForm } from "@/components/app/program-form";
import type { ScopeAsset } from "@/lib/constants";

export const metadata: Metadata = { title: "ویرایش برنامه" };

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ORGANIZATION", "ADMIN");
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      organization: {
        select: { ownerId: true, website: true, members: { where: { userId: user.id }, select: { id: true } } },
      },
    },
  });
  if (!program) notFound();
  const isStaff = program.organization.ownerId === user.id || program.organization.members.length > 0;
  if (!isStaff) redirect("/org/programs");

  return (
    <DashboardShell title={`ویرایش: ${program.title}`} nav={ORG_NAV} currentPath="/org/programs">
      <BackLink href="/org/programs" label="بازگشت به برنامه‌ها" />
      <ProgramForm
        program={{
          id: program.id,
          title: program.title,
          summary: program.summary,
          description: program.description,
          website: program.organization.website ?? "",
          status: program.status,
          currency: program.currency,
          minBounty: program.minBounty,
          maxBounty: program.maxBounty,
          categories: program.categories as string[],
          inScope: program.inScope as ScopeAsset[],
          outOfScope: program.outOfScope as { identifier: string; note?: string }[],
          prohibited: program.prohibited as string[],
          rules: program.rules,
          submissionRequirements: program.submissionRequirements,
          disclosurePolicy: program.disclosurePolicy,
          safeHarbor: program.safeHarbor,
          severityRewards: program.severityRewards as Record<string, number>,
        }}
      />
    </DashboardShell>
  );
}
