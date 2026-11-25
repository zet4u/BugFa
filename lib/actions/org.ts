"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateToken } from "@/lib/audit";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "@/lib/actions/auth";

const orgProfileSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional().or(z.literal("")),
  website: z.string().url("یک URL معتبر وارد کنید").optional().or(z.literal("")),
  twitter: z.string().max(60).optional().or(z.literal("")),
});

export async function updateOrgProfileAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "دسترسی غیرمجاز" };
  const org = await prisma.organization.findFirst({
    where: { ownerId: session.user.id },
  });
  if (!org) return { error: "فقط مالک سازمان می‌تواند پروفایل را ویرایش کند" };

  const parsed = orgProfileSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    website: formData.get("website") || "",
    twitter: formData.get("twitter") || "",
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "ورودی نامعتبر" };

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      twitter: parsed.data.twitter || null,
    },
  });
  await auditLog({ actorId: session.user.id, action: "org.profile_updated", targetType: "Organization", targetId: org.id });
  revalidatePath("/org/profile");
  return { success: "سازمان به‌روزرسانی شد" };
}

export async function inviteTeamMemberAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "دسترسی غیرمجاز" };
  const org = await prisma.organization.findFirst({ where: { ownerId: session.user.id } });
  if (!org) return { error: "فقط مالک سازمان می‌تواند عضو دعوت کند" };

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!z.string().email().safeParse(email).success) return { error: "ایمیل معتبر وارد کنید" };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) return { error: "حسابی با این ایمیل در BugFa نیست. ابتدا از او بخواهید ثبت‌نام کند." };
  if (user.role !== "ORGANIZATION") return { error: "فقط حساب‌های سازمانی می‌توانند به تیم بپیوندند" };

  const alreadyMember = await prisma.organizationMember.findFirst({
    where: { organizationId: org.id, userId: user.id },
  });
  if (alreadyMember) return { error: "قبلاً عضو این تیم است" };

  await prisma.teamInvite.create({
    data: {
      organizationId: org.id,
      email,
      role: String(formData.get("role") ?? "MEMBER"),
      token: generateToken(),
    },
  });
  await auditLog({ actorId: session.user.id, action: "org.member_invited", targetType: "Organization", targetId: org.id, metadata: { email } });
  revalidatePath("/org/team");
  return { success: `Invite ready for ${email}. They can accept it from their team page.` };
}

export async function acceptInviteAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "دسترسی غیرمجاز" };

  const token = String(formData.get("token") ?? "");
  const invite = await prisma.teamInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.email !== session.user.email) {
    return { error: "این دعوت‌نامه نامعتبر است یا برای حساب شما صادر نشده" };
  }
  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { organizationId: invite.organizationId, userId: session.user.id, role: invite.role },
    }),
    prisma.teamInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  await auditLog({ actorId: session.user.id, action: "org.invite_accepted" });
  revalidatePath("/org/team");
  return { success: "به این سازمان پیوستید" };
}

export async function removeTeamMemberAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const org = await prisma.organization.findFirst({ where: { ownerId: session.user.id } });
  if (!org) return;

  const memberId = String(formData.get("memberId") ?? "");
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    select: { organizationId: true, role: true },
  });
  if (!member || member.organizationId !== org.id || member.role === "OWNER") return;

  await prisma.organizationMember.delete({ where: { id: memberId } });
  await auditLog({ actorId: session.user.id, action: "org.member_removed", targetType: "OrganizationMember", targetId: memberId });
  revalidatePath("/org/team");
}
