import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readObject } from "@/lib/storage";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachment = await prisma.attachment.findFirst({
    where: { storageKey: key },
    select: {
      mimeType: true,
      filename: true,
      report: {
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
      },
    },
  });
  if (!attachment) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const allowed =
    session.user.role === "ADMIN" ||
    attachment.report.researcherId === session.user.id ||
    attachment.report.program.organization.ownerId === session.user.id ||
    attachment.report.program.organization.members.length > 0;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await readObject(key);
  if (!data) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
