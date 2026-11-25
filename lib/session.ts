import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "RESEARCHER" | "ORGANIZATION" | "ADMIN";
};

export const getSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { forbidden: true },
  });
  if (!dbUser || dbUser.forbidden) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      role: (session.user as any).role as SessionUser["role"],
    },
  };
});

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function isOrgMember(userId: string, organizationId: string) {
  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return !!org;
}

export async function getOrgForUser(userId: string) {
  return prisma.organization.findFirst({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
}
