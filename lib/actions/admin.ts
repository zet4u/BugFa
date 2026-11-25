"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { disputeResolutionSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { ActionState } from "@/lib/actions/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

export async function setOrgVerifiedAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const orgId = String(formData.get("organizationId") ?? "");
  const verified = formData.get("verified") === "true";

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, ownerId: true, name: true },
  });
  if (!org) return;

  await prisma.organization.update({ where: { id: orgId }, data: { verified } });
  await notify({
    userId: org.ownerId,
    type: "ORG_VERIFICATION",
    title: verified ? `Organization verified: ${org.name}` : `Verification removed: ${org.name}`,
    link: "/org",
  });
  await auditLog({ actorId: admin.id, action: "admin.org_verified", targetType: "Organization", targetId: orgId, metadata: { verified } });
  revalidatePath("/admin/organizations");
}

export async function setUserForbiddenAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const forbidden = formData.get("forbidden") === "true";
  if (userId === admin.id) return;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target || target.role === "ADMIN") return;

  await prisma.user.update({ where: { id: userId }, data: { forbidden } });
  await auditLog({ actorId: admin.id, action: "admin.user_banned", targetType: "User", targetId: userId, metadata: { forbidden } });
  revalidatePath("/admin/users");
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!["RESEARCHER", "ORGANIZATION", "ADMIN"].includes(role)) return;
  if (userId === admin.id) return;

  await prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  await auditLog({ actorId: admin.id, action: "admin.user_role_changed", targetType: "User", targetId: userId, metadata: { role } });
  revalidatePath("/admin/users");
}

export async function moderateProgramAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const programId = String(formData.get("programId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["DRAFT", "PUBLIC", "PRIVATE", "PAUSED"].includes(status)) return;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true, title: true, organization: { select: { ownerId: true, members: { select: { userId: true } } } } },
  });
  if (!program) return;

  await prisma.program.update({
    where: { id: programId },
    data: { status: status as any },
  });
  const recipients = new Set<string>([
    program.organization.ownerId,
    ...program.organization.members.map((m) => m.userId),
  ]);
  for (const userId of recipients) {
    await notify({
      userId,
      type: "SYSTEM",
      title: `Program moderated by BugFa team: ${program.title}`,
      body: `New status: ${status}`,
      link: "/org/programs",
    });
  }
  await auditLog({ actorId: admin.id, action: "admin.program_moderated", targetType: "Program", targetId: programId, metadata: { status } });
  revalidatePath("/admin/programs");
}

export async function resolveDisputeAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "دسترسی غیرمجاز" };

  const parsed = disputeResolutionSchema.safeParse({
    disputeId: formData.get("disputeId"),
    resolution: formData.get("resolution"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "ورودی نامعتبر" };

  const dispute = await prisma.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { report: { select: { id: true, researcherId: true, title: true } } },
  });
  if (!dispute) return { error: "اختلاف پیدا نشد" };
  if (dispute.status !== "OPEN") return { error: "این اختلاف قبلاً حل شده است" };

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: parsed.data.outcome,
      resolution: parsed.data.resolution,
      resolvedAt: new Date(),
    },
  });

  await notify({
    userId: dispute.report.researcherId,
    type: "SYSTEM",
    title: `Dispute resolved: ${dispute.report.title}`,
    body: parsed.data.resolution.slice(0, 200),
    link: `/researcher/submissions/${dispute.report.id}`,
  });
  await auditLog({
    actorId: admin.id,
    action: "admin.dispute_resolved",
    targetType: "Dispute",
    targetId: dispute.id,
    metadata: { outcome: parsed.data.outcome },
  });
  revalidatePath("/admin/disputes");
  return { success: "اختلاف حل شد" };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard/notifications");
}

export async function markNotificationReadAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const id = String(formData.get("id") ?? "");
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/dashboard/notifications");
}
