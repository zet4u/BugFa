import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { BackLink } from "@/components/app/back-link";
import { ReportView } from "@/components/app/report-view";
import { StatusControls } from "@/components/app/report-controls";

export const metadata: Metadata = { title: "بررسی گزارش" };

export default async function AdminReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: { severity: true, status: true, currency: true, program: { select: { severityRewards: true } } },
  });
  if (!report) notFound();

  const rewards = report.program.severityRewards as Record<string, number>;

  return (
    <DashboardShell title="نظارت بر گزارش‌ها" nav={ADMIN_NAV} currentPath="/admin/reports">
      <BackLink href="/admin/reports" label="بازگشت به گزارش‌ها" />
      <ReportView reportId={id} viewerId="" isStaff={true}
        controls={
          <StatusControls
            reportId={id}
            currentStatus={report.status}
            rewardDefault={rewards[report.severity] ?? 0}
            currency={report.currency}
          />
        }
      />
    </DashboardShell>
  );
}
