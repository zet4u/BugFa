import Link from "next/link";
import { ShieldCheck, Lock, PauseCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import type { ScopeAsset } from "@/lib/constants";

export type ProgramCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  featured: boolean;
  categories: string[];
  minBounty: number;
  maxBounty: number;
  currency: string;
  logoUrl: string | null;
  organization: { name: string; slug: string; verified: boolean; logoUrl: string | null };
};

export function ProgramTileIcon({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border bg-secondary/60 font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ProgramStatusPill({ status }: { status: string }) {
  if (status === "PUBLIC") return null;
  if (status === "PRIVATE")
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className="h-3 w-3" /> Private
      </Badge>
    );
  if (status === "PAUSED")
    return (
      <Badge variant="secondary" className="gap-1 text-amber-400">
        <PauseCircle className="h-3 w-3" /> Paused
      </Badge>
    );
  return null;
}

export function ProgramCard({ program }: { program: ProgramCardData }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <ProgramTileIcon name={program.organization.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
              {program.title}
            </h3>
            {program.featured ? <Star className="h-4 w-4 shrink-0 fill-primary text-primary" /> : null}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {program.organization.name}
            {program.organization.verified ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : null}
          </p>
        </div>
        <ProgramStatusPill status={program.status} />
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{program.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {program.categories.slice(0, 3).map((c) => (
          <Badge key={c} variant="secondary" className="font-normal">
            {c}
          </Badge>
        ))}
        {program.categories.length > 3 ? (
          <Badge variant="secondary" className="font-normal">
            +{program.categories.length - 3}
          </Badge>
        ) : null}
      </div>
      <div className="mt-4">
        {program.maxBounty > 0 ? (
          <span className="font-mono text-sm font-semibold text-primary">
            {formatMoney(program.minBounty, program.currency)} –{" "}
            {formatMoney(program.maxBounty, program.currency)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Thanks / VDP</span>
        )}
      </div>
    </Link>
  );
}
