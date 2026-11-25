import "server-only";
import { prisma } from "@/lib/prisma";

export async function notify(params: {
  userId: string;
  type: "REPORT_STATUS" | "REPORT_COMMENT" | "REPORT_REWARD" | "ACHIEVEMENT" | "ORG_VERIFICATION" | "SYSTEM";
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("notification_failed", err);
  }
}

export async function notifyMany(
  userIds: string[],
  data: {
    type: "REPORT_STATUS" | "REPORT_COMMENT" | "REPORT_REWARD" | "ACHIEVEMENT" | "ORG_VERIFICATION" | "SYSTEM";
    title: string;
    body?: string;
    link?: string;
  }
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...data })),
  });
}
