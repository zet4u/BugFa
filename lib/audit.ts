import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function auditLog(params: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata ?? undefined) as any,
        ip: clientIpFromHeaders(h),
      },
    });
  } catch (err) {
    console.error("audit_log_failed", err);
  }
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
