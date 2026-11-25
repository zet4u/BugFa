import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { BackLink } from "@/components/app/back-link";
import { ReportView } from "@/components/app/report-view";
import { StatusControls } from "@/components/app/report-controls";

export const metadata: Metadata = { title: "بررسی گزارش" };

export default async function OrgReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      severity: true,
      status: true,
      program: {
        select: {
          currency: true,
          severityRewards: true,
          organization: {
            select: {
              ownerId: true,
              members: { where: { userId: user.id }, select: { id: true } },
            },
          },
        },
      },
    },
  });
  if (!report) notFound();

  const isStaff =
    report.program.organization.ownerId === user.id ||
    report.program.organization.members.length > 0;
  if (!isStaff) redirect("/org/reports");

  const rewards = report.program.severityRewards as Record<string, number>;

  return (
    <DashboardShell title="بررسی گزارش" nav={ORG_NAV} currentPath="/org/reports">
      <BackLink href="/org/reports" label="بازگشت به گزارش‌ها" />
      <ReportView
        reportId={id}
        viewerId={user.id}
        isStaff={true}
        controls={
          <StatusControls
            reportId={id}
            currentStatus={report.status}
            rewardDefault={rewards[report.severity] ?? 0}
            currency={report.program.currency}
          />
        }
      />
    </DashboardShell>
  );
}
