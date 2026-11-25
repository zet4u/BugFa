"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { profileSchema, changePasswordSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import type { ActionState } from "@/lib/actions/auth";

export async function updateProfileAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "دسترسی غیرمجاز" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    bio: formData.get("bio") || "",
    country: formData.get("country") || "",
    website: formData.get("website") || "",
    github: formData.get("github") || "",
    twitter: formData.get("twitter") || "",
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "ورودی نامعتبر" };

  const clash = await prisma.user.findFirst({
    where: { username: parsed.data.username, id: { not: session.user.id } },
    select: { id: true },
  });
  if (clash) return { error: "این نام کاربری قبلاً گرفته شده" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      bio: parsed.data.bio || null,
      country: parsed.data.country || null,
      website: parsed.data.website || null,
      github: parsed.data.github || null,
      twitter: parsed.data.twitter || null,
    },
  });
  await auditLog({ actorId: session.user.id, action: "profile.updated" });
  revalidatePath("/dashboard/settings");
  return { success: "پروفایل به‌روزرسانی شد" };
}

export async function changePasswordAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "دسترسی غیرمجاز" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "ورودی نامعتبر" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "دسترسی غیرمجاز" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "رمز عبور فعلی نادرست است" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await auditLog({ actorId: user.id, action: "auth.password_changed" });
  return { success: "رمز عبور تغییر کرد" };
}
