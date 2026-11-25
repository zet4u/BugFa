"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/actions/auth";

async function requireOrg() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ORGANIZATION") return null;
  return prisma.organization.findFirst({
    where: { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
  });
}

function parseScopeJson(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function uniqueProgramSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "program";
  let slug = base;
  let n = 1;
  const existing = await prisma.program.findUnique({ where: { slug } });
  if (!existing || existing.id === ignoreId) return slug;
  while (await prisma.program.findUnique({ where: { slug: `${base}-${n}` } })) n++;
  return `${base}-${n}`;
}

export async function saveProgramAction(_prev: unknown, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const org = await requireOrg();
  if (!org) return { error: "Only organization accounts can manage programs" };

  const fields = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    website: formData.get("website"),
    status: formData.get("status") || "DRAFT",
    categories: parseScopeJson(formData.get("categories")),
    inScope: parseScopeJson(formData.get("inScope")),
    outOfScope: parseScopeJson(formData.get("outOfScope")) ?? [],
    prohibited: parseScopeJson(formData.get("prohibited")) ?? [],
    rules: formData.get("rules"),
    submissionRequirements: formData.get("submissionRequirements"),
    disclosurePolicy: formData.get("disclosurePolicy"),
    safeHarbor: formData.get("safeHarbor") === "on",
    minBounty: Number(formData.get("minBounty") ?? 0),
    maxBounty: Number(formData.get("maxBounty") ?? 0),
    currency: formData.get("currency") || "USD",
    severityRewards: parseScopeJson(formData.get("severityRewards")),
  };
  const parsed = programSchema.safeParse(fields);
  if (!parsed.success) {
    const issues = parsed.error.errors.map((e) => e.message).slice(0, 3).join("; ");
    return { error: issues || "Invalid input" };
  }
  if (parsed.data.maxBounty < parsed.data.minBounty) {
    return { error: "Maximum bounty must be greater than or equal to minimum bounty" };
  }

  const programId = (formData.get("programId") as string) || "";
  const data = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description,
    status: parsed.data.status,
    categories: parsed.data.categories,
    inScope: parsed.data.inScope as any,
    outOfScope: parsed.data.outOfScope as any,
    prohibited: parsed.data.prohibited,
    rules: parsed.data.rules || null,
    submissionRequirements: parsed.data.submissionRequirements || null,
    disclosurePolicy: parsed.data.disclosurePolicy,
    safeHarbor: parsed.data.safeHarbor,
    minBounty: parsed.data.minBounty,
    maxBounty: parsed.data.maxBounty,
    currency: parsed.data.currency,
    severityRewards: parsed.data.severityRewards as any,
  };

  if (programId) {
    const existing = await prisma.program.findUnique({ where: { id: programId }, select: { organizationId: true } });
    if (!existing || existing.organizationId !== org.id) return { error: "Not found" };
    await prisma.program.update({ where: { id: programId }, data });
    await auditLog({ actorId: session.user.id, action: "program.updated", targetType: "Program", targetId: programId });
    revalidatePath("/org/programs");
    return { success: programId };
  }

  const created = await prisma.program.create({
    data: {
      ...data,
      slug: await uniqueProgramSlug(parsed.data.title),
      organizationId: org.id,
      publishedAt: parsed.data.status === "PUBLIC" ? new Date() : null,
    },
  });
  await auditLog({ actorId: session.user.id, action: "program.created", targetType: "Program", targetId: created.id });
  return { success: created.id };
}

export async function setProgramStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const org = await requireOrg();
  if (!org) return;

  const programId = String(formData.get("programId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["DRAFT", "PUBLIC", "PRIVATE", "PAUSED"].includes(status)) return;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { organizationId: true },
  });
  if (!program || program.organizationId !== org.id) return;

  await prisma.program.update({
    where: { id: programId },
    data: { status: status as any, publishedAt: status === "PUBLIC" ? new Date() : undefined },
  });
  await auditLog({ actorId: session.user.id, action: "program.status_changed", targetType: "Program", targetId: programId, metadata: { status } });
  revalidatePath("/org/programs");
}
