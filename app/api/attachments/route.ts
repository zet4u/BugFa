import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/storage";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

function isCsv(s: string | null, v: string) {
  if (!s) return false;
  return s.split(/\s*,\s*/).includes(v);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: "مبدا درخواست نامعتبر است" }, { status: 403 });
  }

  const limiter = await checkRateLimit(`upload:${clientIpFromHeaders(req.headers)}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "تعداد بارگذاری‌ها بیش از حد مجاز است" }, { status: 429 });
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "داده فرم نامعتبر است" }, { status: 400 });
  }

  const reportId = String(form.get("reportId") ?? "");
  const file = form.get("file");
  if (!reportId || !(file instanceof File)) {
    return NextResponse.json({ error: "شناسه گزارش یا فایل ارسال نشده است" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      researcherId: true,
      program: {
        select: {
          organization: {
            select: { ownerId: true, members: { where: { userId: session.user.id }, select: { id: true } } },
          },
        },
      },
    },
  });
  if (!report) return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });

  const isStaff =
    report.program.organization.ownerId === session.user.id ||
    report.program.organization.members.length > 0;
  if (report.researcherId !== session.user.id && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(file.name, file.type || "application/octet-stream", buffer);
  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: 415 });
  }

  const attachment = await prisma.attachment.create({
    data: {
      reportId,
      uploaderId: session.user.id,
      filename: file.name.replace(/[^\w.\-]/g, "_").slice(0, 120),
      mimeType: file.type || "application/octet-stream",
      size: buffer.byteLength,
      storageKey: stored.storageKey,
    },
  });

  return NextResponse.json({ id: attachment.id, filename: attachment.filename, size: attachment.size });
}
