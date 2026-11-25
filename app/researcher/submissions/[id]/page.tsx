import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { BackLink } from "@/components/app/back-link";
import { ReportView } from "@/components/app/report-view";
import { DisputeForm } from "@/components/app/report-controls";

export const metadata: Metadata = { title: "گزارش" };

export default async function ResearcherReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: { researcherId: true },
  });
  if (!report) notFound();
  if (report.researcherId !== user.id) redirect("/researcher/submissions");

  return (
    <DashboardShell title="گزارش" nav={RESEARCHER_NAV} currentPath="/researcher/submissions">
      <BackLink href="/researcher/submissions" label="بازگشت به گزارش‌ها" />
      <ReportView
        reportId={id}
        viewerId={user.id}
        isStaff={false}
        controls={<DisputeForm reportId={id} />}
      />
    </DashboardShell>
  );
}
