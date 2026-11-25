"use server";

import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema, requestPasswordResetSchema, passwordResetSchema } from "@/lib/validation";
import { generateToken, hashToken, auditLog } from "@/lib/audit";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; success?: string } | null;

async function ipKey(prefix: string) {
  const h = await headers();
  return `${prefix}:${clientIpFromHeaders(h)}`;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const limiter = await checkRateLimit(await ipKey("login"), 10, 60_000);
  if (!limiter.ok) {
    return { error: `Too many attempts. Try again in ${limiter.retryAfter} seconds.` };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { error: "Invalid email or password" };
  }
  await auditLog({ action: "auth.login", metadata: { email: parsed.data.email } });
  return { success: "Signed in" };
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    organizationName: formData.get("organizationName") || undefined,
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const limiter = await checkRateLimit(await ipKey("register"), 5, 60_000);
  if (!limiter.ok) {
    return { error: `Too many attempts. Try again in ${limiter.retryAfter} seconds.` };
  }

  const { name, username, email, password, role, organizationName } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    return {
      error:
        existing.email === email.toLowerCase()
          ? "An account with this email already exists"
          : "This username is taken",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const emailToken = generateToken();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        username,
        email: email.toLowerCase(),
        passwordHash,
        role,
        tokens: {
          create: {
            type: "EMAIL_VERIFICATION",
            token: hashToken(emailToken),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        },
      },
    });

    if (role === "ORGANIZATION" && organizationName) {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug: await uniqueOrgSlug(organizationName),
          ownerId: created.id,
        },
      });
      await tx.organizationMember.create({
        data: { organizationId: org.id, userId: created.id, role: "OWNER" },
      });
    }

    return created;
  });

  await auditLog({ actorId: user.id, action: "auth.register", metadata: { role } });
  console.log(`[dev] email verification link: /verify-email?token=${emailToken}`);

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Account created but sign-in failed. Please log in." };
  }
  return { success: "Account created" };
}

async function uniqueOrgSlug(name: string) {
  const base = slugify(name) || "org";
  let slug = base;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email" };

  const limiter = await checkRateLimit(await ipKey("pwreset"), 5, 60_000);
  if (!limiter.ok) return { error: "Too many attempts. Try again later." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user) {
    const token = generateToken();
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        token: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
    console.log(`[dev] password reset link: /reset-password?token=${token}`);
  }
  return {
    success: "If that email exists, a reset link has been sent. Check your inbox.",
  };
}

export async function passwordResetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const record = await prisma.authToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
    include: { user: true },
  });
  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.authToken.updateMany({
      where: { userId: record.userId, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
  await auditLog({ actorId: record.userId, action: "auth.password_reset" });
  return { success: "Password updated. You can now log in." };
}

export async function verifyEmailAction(token: string): Promise<ActionState> {
  const record = await prisma.authToken.findUnique({ where: { token: hashToken(token) } });
  if (!record || record.type !== "EMAIL_VERIFICATION" || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This verification link is invalid or has expired" };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await auditLog({ actorId: record.userId, action: "auth.email_verified" });
  return { success: "Email verified" };
}

export async function resendVerificationAction(): Promise<ActionState> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.emailVerified) return null;

  const limiter = await checkRateLimit(`verify:${user.id}`, 3, 60 * 60_000);
  if (!limiter.ok) return { error: "Please wait before requesting another email." };

  const token = generateToken();
  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      token: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  console.log(`[dev] email verification link: /verify-email?token=${token}`);
  return { success: "Verification email sent." };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

async function getSessionUser() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  return session?.user ? { id: session.user.id! } : null;
}
