"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleBookmarkAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const programId = String(formData.get("programId") ?? "");
  if (!programId) return;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_programId: { userId: session.user.id, programId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: session.user.id, programId } });
  }
  revalidatePath("/researcher/bookmarks");
  revalidatePath("/researcher/programs");
  revalidatePath("/explore");
}
