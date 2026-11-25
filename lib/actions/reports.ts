"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema, commentSchema, statusUpdateSchema, disputeSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { checkAchievements } from "@/lib/gamification";
import { POINTS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

export async function canAccessReport(reportId: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      researcherId: true,
      program: {
        select: {
          organization: {
            select: {
              ownerId: true,
              members: { where: { userId }, select: { id: true } },
            },
          },
        },
      },
    },
  });
  if (!report) return false;
  return (
    report.researcherId === userId ||
    report.program.organization.ownerId === userId ||
    report.program.organization.members.some((m) => m.id)
  );
}

export async function submitReportAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in as a researcher" };
  if (session.user.role !== "RESEARCHER" && session.user.role !== "ADMIN") {
    return { error: "Only researcher accounts can submit reports" };
  }

  const parsed = reportSchema.safeParse({
    programId: formData.get("programId"),
    title: formData.get("title"),
    asset: formData.get("asset"),
    category: formData.get("category"),
    severity: formData.get("severity"),
    description: formData.get("description"),
    steps: formData.get("steps"),
    impact: formData.get("impact"),
    proofOfConcept: formData.get("proofOfConcept"),
    remediation: formData.get("remediation"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const program = await prisma.program.findUnique({
    where: { id: parsed.data.programId },
    select: { id: true, status: true, title: true, slug: true },
  });
  if (!program || program.status !== "PUBLIC") {
    return { error: "This program is not accepting submissions" };
  }

  const report = await prisma.report.create({
    data: {
      programId: program.id,
      researcherId: session.user.id,
      title: parsed.data.title,
      asset: parsed.data.asset,
      category: parsed.data.category,
      severity: parsed.data.severity,
      description: parsed.data.description,
      steps: parsed.data.steps,
      impact: parsed.data.impact,
      proofOfConcept: parsed.data.proofOfConcept || null,
      remediation: parsed.data.remediation || null,
    },
  });

  const org = await prisma.program.findUnique({
    where: { id: program.id },
    select: {
      organization: {
        select: { ownerId: true, members: { select: { userId: true } } },
      },
    },
  });
  if (org) {
    const recipients = new Set<string>([org.organization.ownerId, ...org.organization.members.map((m) => m.userId)]);
    recipients.delete(session.user.id);
    for (const userId of recipients) {
      await notify({
        userId,
        type: "REPORT_STATUS",
        title: `New report: ${parsed.data.title}`,
        body: `Submitted to ${program.title}`,
        link: `/org/reports/${report.id}`,
      });
    }
  }

  await auditLog({
    actorId: session.user.id,
    action: "report.submitted",
    targetType: "Report",
    targetId: report.id,
    metadata: { programId: program.id, severity: parsed.data.severity },
  });

  revalidatePath("/researcher/submissions");
  revalidatePath("/org/reports");
  return { success: `/researcher/submissions/${report.id}` };
}

export async function addCommentAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = commentSchema.safeParse({
    reportId: formData.get("reportId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Write a message first" };

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: {
      researcherId: true,
      title: true,
      program: {
        select: { title: true, organization: { select: { ownerId: true, members: { select: { userId: true } } } } },
      },
    },
  });
  if (!report) return { error: "Report not found" };

  const isResearcher = report.researcherId === session.user.id;
  const isStaff =
    report.program.organization.ownerId === session.user.id ||
    report.program.organization.members.some((m) => m.userId === session.user.id);
  if (!isResearcher && !isStaff) return { error: "Unauthorized" };

  await prisma.reportComment.create({
    data: {
      reportId: parsed.data.reportId,
      authorId: session.user.id,
      body: parsed.data.body,
      internal: formData.get("internal") === "on" && isStaff,
    },
  });

  if (isResearcher) {
    const recipients = new Set<string>([
      report.program.organization.ownerId,
      ...report.program.organization.members.map((m) => m.userId),
    ]);
    for (const userId of recipients) {
      await notify({
        userId,
        type: "REPORT_COMMENT",
        title: `New comment on "${report.title}"`,
        body: parsed.data.body.slice(0, 120),
        link: `/org/reports/${parsed.data.reportId}`,
      });
    }
  } else {
    await notify({
      userId: report.researcherId,
      type: "REPORT_COMMENT",
      title: `New comment on "${report.title}"`,
      body: parsed.data.body.slice(0, 120),
      link: `/researcher/submissions/${parsed.data.reportId}`,
    });
  }

  revalidatePath(`/org/reports/${parsed.data.reportId}`);
  revalidatePath(`/researcher/submissions/${parsed.data.reportId}`);
  return { success: "Comment posted" };
}

export async function updateReportStatusAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = statusUpdateSchema.safeParse({
    reportId: formData.get("reportId"),
    status: formData.get("status"),
    rewardAmount: formData.get("rewardAmount")
      ? Number(formData.get("rewardAmount"))
      : undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: {
      id: true,
      researcherId: true,
      title: true,
      severity: true,
      status: true,
      currency: true,
      triagedAt: true,
      program: {
        select: {
          title: true,
          status: true,
          severityRewards: true,
          organization: {
            select: { id: true, ownerId: true, members: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (!report) return { error: "Report not found" };

  const isAdmin = session.user.role === "ADMIN";
  const isStaff =
    report.program.organization.ownerId === session.user.id ||
    report.program.organization.members.some((m) => m.userId === session.user.id);
  if (!isStaff && !isAdmin) return { error: "Unauthorized" };

  let rewardAmount: number | null | undefined = parsed.data.rewardAmount ?? null;
  if (parsed.data.status === "REWARDED") {
    if (rewardAmount == null) {
      const rewards = report.program.severityRewards as Record<string, number> | null;
      rewardAmount = rewards?.[report.severity] ?? 0;
    }
  } else {
    rewardAmount = null;
  }

  const isPositive = ["ACCEPTED", "RESOLVED", "REWARDED"].includes(parsed.data.status);
  const wasPositive = ["ACCEPTED", "RESOLVED", "REWARDED"].includes(report.status);
  const wasRewarded = report.status === "REWARDED";

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: report.id },
      data: {
        status: parsed.data.status,
        rewardAmount: parsed.data.status === "REWARDED" ? rewardAmount ?? 0 : null,
        currency: report.currency,
        points: isPositive ? POINTS[report.severity] : 0,
        triagedAt: report.triagedAt ?? (parsed.data.status === "TRIAGED" ? new Date() : null),
        resolvedAt: isPositive ? new Date() : null,
      },
    });
    if (parsed.data.note) {
      await tx.reportComment.create({
        data: {
          reportId: report.id,
          authorId: session.user!.id,
          body: parsed.data.note!,
        },
      });
    }
  });

  await notify({
    userId: report.researcherId,
    type: parsed.data.status === "REWARDED" ? "REPORT_REWARD" : "REPORT_STATUS",
    title: `Report ${parsed.data.status.charAt(0) + parsed.data.status.slice(1).toLowerCase()}: ${report.title}`,
    body: parsed.data.status === "REWARDED" ? `Reward: ${rewardAmount}` : parsed.data.note,
    link: `/researcher/submissions/${report.id}`,
  });

  if (isPositive && !wasPositive) {
    await checkAchievements(report.researcherId);
  }
  if (!isPositive && wasRewarded) {
    await prisma.report.update({ where: { id: report.id }, data: { points: 0 } });
  }

  await auditLog({
    actorId: session.user.id,
    action: "report.status_updated",
    targetType: "Report",
    targetId: report.id,
    metadata: { from: report.status, to: parsed.data.status, rewardAmount },
  });

  revalidatePath(`/org/reports/${report.id}`);
  revalidatePath(`/researcher/submissions/${report.id}`);
  revalidatePath("/leaderboard");
  return { success: "Status updated" };
}

export async function openDisputeAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = disputeSchema.safeParse({
    reportId: formData.get("reportId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: { id: true, researcherId: true, title: true, dispute: { select: { id: true } } },
  });
  if (!report || report.researcherId !== session.user.id) return { error: "Unauthorized" };
  if (report.dispute) return { error: "A dispute is already open for this report" };

  await prisma.dispute.create({
    data: {
      reportId: report.id,
      openedById: session.user.id,
      reason: parsed.data.reason,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action: "dispute.opened",
    targetType: "Report",
    targetId: report.id,
  });
  revalidatePath(`/researcher/submissions/${report.id}`);
  return { success: "Dispute submitted. The BugFa team will review it." };
}
