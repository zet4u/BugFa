import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { ProgramCard } from "@/components/app/program-card";
import { EmptyState } from "@/components/app/empty-state";
import { Bookmark } from "lucide-react";
import { toggleBookmarkAction } from "@/lib/actions/bookmarks";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bookmarked programs" };

export default async function BookmarksPage() {
  const user = await requireUser();
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      program: {
        include: { organization: { select: { name: true, slug: true, verified: true, logoUrl: true } } },
      },
    },
  });

  return (
    <DashboardShell title="Bookmarked programs" subtitle={`${bookmarks.length} saved`} nav={RESEARCHER_NAV} currentPath="/researcher/bookmarks">
      {bookmarks.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title="No bookmarks yet"
          description="Bookmark programs to keep quick access from your dashboard."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks.map((b) => (
            <div key={b.id} className="relative">
              <ProgramCard program={b.program as any} />
              <form action={toggleBookmarkAction} className="absolute right-2 top-2">
                <input type="hidden" name="programId" value={b.programId} />
                <Button type="submit" variant="ghost" size="icon" className="text-primary" aria-label="Remove bookmark">
                  <Bookmark className="fill-current" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
