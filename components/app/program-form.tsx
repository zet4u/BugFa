"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveProgramAction } from "@/lib/actions/programs";
import type { ActionState } from "@/lib/actions/auth";
import {
  VULN_CATEGORIES,
  SEVERITIES,
  SCOPE_ASSET_TYPES,
  BOUNTY_CURRENCIES,
  DISCLOSURE_POLICIES,
  DEFAULT_SEVERITY_REWARDS,
  type SeverityValue,
  type ScopeAsset,
} from "@/lib/constants";

type OutOfScopeRow = { identifier: string; note?: string };

export type ProgramFormDefaults = {
  id?: string;
  title?: string;
  summary?: string;
  description?: string;
  website?: string;
  status?: string;
  currency?: string;
  minBounty?: number;
  maxBounty?: number;
  categories?: string[];
  inScope?: ScopeAsset[];
  outOfScope?: OutOfScopeRow[];
  prohibited?: string[];
  rules?: string | null;
  submissionRequirements?: string | null;
  disclosurePolicy?: string;
  safeHarbor?: boolean;
  severityRewards?: Record<string, number>;
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  WEB: "Web",
  API: "API",
  MOBILE: "Mobile",
  DESKTOP: "Desktop",
  HARDWARE: "Hardware",
  OTHER: "Other",
};

function ScopeRow({
  asset,
  index,
  onChange,
  onRemove,
}: {
  asset: ScopeAsset;
  index: number;
  onChange: (next: ScopeAsset) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="grid gap-3 sm:grid-cols-[130px_1fr_150px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={asset.type}
            onValueChange={(v) => onChange({ ...asset, type: v })}
          >
            <SelectTrigger aria-label="Asset type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_ASSET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ASSET_TYPE_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Identifier</Label>
          <Input
            value={asset.identifier}
            onChange={(e) => onChange({ ...asset, identifier: e.target.value })}
            placeholder="*.example.com or https://api.example.com/v1"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max severity</Label>
          <Select
            value={asset.maxSeverity}
            onValueChange={(v) => onChange({ ...asset, maxSeverity: v as SeverityValue })}
          >
            <SelectTrigger aria-label="Max severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground">
          Remove
        </Button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Instructions (optional)</Label>
          <Input
            value={asset.instruction ?? ""}
            onChange={(e) => onChange({ ...asset, instruction: e.target.value })}
            placeholder="e.g. Only test accounts under *.qa.example.com"
          />
        </div>
        <label className="flex items-center gap-2 self-end text-sm text-muted-foreground">
          <Checkbox
            checked={asset.eligibleForBounty}
            onCheckedChange={(v) => onChange({ ...asset, eligibleForBounty: v === true })}
          />
          Eligible for monetary bounty
        </label>
      </div>
    </div>
  );
}

export function ProgramForm({ program }: { program?: ProgramFormDefaults }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveProgramAction, null);
  const router = useRouter();

  const [status, setStatus] = useState(program?.status ?? "DRAFT");
  const [currency, setCurrency] = useState(program?.currency ?? "USD");
  const [categories, setCategories] = useState<string[]>(program?.categories ?? []);
  const [inScope, setInScope] = useState<ScopeAsset[]>(
    program?.inScope?.length
      ? program.inScope
      : [{ type: "WEB", identifier: "", eligibleForBounty: true, maxSeverity: "CRITICAL" }]
  );
  const [outOfScope, setOutOfScope] = useState<OutOfScopeRow[]>(
    program?.outOfScope?.length
      ? program.outOfScope
      : [{ identifier: "", note: "" }]
  );
  const [severityRewards, setSeverityRewards] = useState<Record<string, number>>({
    ...DEFAULT_SEVERITY_REWARDS,
    ...(program?.severityRewards ?? {}),
  });
  const [safeHarbor, setSafeHarbor] = useState(program?.safeHarbor ?? true);
  const [prohibited, setProhibited] = useState(
    program?.prohibited?.length ? program.prohibited.join("\n") : ""
  );

  useEffect(() => {
    if (state?.success) router.push("/org/programs");
  }, [state, router]);

  const toggleCategory = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const scopeValid = JSON.stringify(inScope);
  const outScopeValid = JSON.stringify(outOfScope.filter((r) => r.identifier.trim().length > 0));

  return (
    <form action={formAction} className="space-y-6">
      {program?.id ? <input type="hidden" name="programId" value={program.id} /> : null}
      {state?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Program name</Label>
              <Input id="title" name="title" required minLength={4} maxLength={120}
                defaultValue={program?.title ?? ""} placeholder="e.g. Nebula Web" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Company website</Label>
              <Input id="website" name="website" required type="url"
                defaultValue={program?.website ?? ""} placeholder="https://example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Short summary</Label>
            <Input id="summary" name="summary" required minLength={20} maxLength={280}
              defaultValue={program?.summary ?? ""}
              placeholder="One-paragraph pitch shown on the program card" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required minLength={50} rows={6}
              defaultValue={program?.description ?? ""}
              placeholder="Describe the product, environment, and what researchers should know before testing." />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Visibility</Label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" aria-label="Program status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minBounty">Min bounty</Label>
              <Input id="minBounty" name="minBounty" type="number" min={0} required
                defaultValue={program?.minBounty ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBounty">Max bounty</Label>
              <Input id="maxBounty" name="maxBounty" type="number" min={0} required
                defaultValue={program?.maxBounty ?? 0} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <input type="hidden" name="currency" value={currency} />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOUNTY_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disclosurePolicy">Disclosure policy</Label>
              <Select name="disclosurePolicy" defaultValue={program?.disclosurePolicy ?? "COORDINATED"}>
                <SelectTrigger id="disclosurePolicy" aria-label="Disclosure policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCLOSURE_POLICIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={safeHarbor} onCheckedChange={(v) => setSafeHarbor(v === true)} />
            Safe harbor — we will not pursue legal action against good-faith research
          </label>
          <input type="hidden" name="safeHarbor" value={safeHarbor ? "on" : ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="hidden" name="inScope" value={scopeValid} />
          <div className="space-y-3">
            {inScope.map((asset, i) => (
              <ScopeRow
                key={i}
                index={i}
                asset={asset}
                onChange={(next) =>
                  setInScope((prev) => prev.map((a, j) => (j === i ? next : a)))
                }
                onRemove={() => setInScope((prev) => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setInScope((prev) => [
                ...prev,
                { type: "WEB", identifier: "", eligibleForBounty: true, maxSeverity: "CRITICAL" },
              ])
            }
          >
            Add in-scope asset
          </Button>

          <div className="pt-2" />
          <input type="hidden" name="outOfScope" value={outScopeValid} />
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Out-of-scope assets</Label>
          {outOfScope.map((row, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Input
                value={row.identifier}
                onChange={(e) =>
                  setOutOfScope((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, identifier: e.target.value } : r))
                  )
                }
                placeholder="e.g. blog.example.com"
              />
              <Input
                value={row.note ?? ""}
                onChange={(e) =>
                  setOutOfScope((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, note: e.target.value } : r))
                  )
                }
                placeholder="Reason / note (optional)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setOutOfScope((prev) => prev.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOutOfScope((prev) => [...prev, { identifier: "", note: "" }])}
          >
            Add out-of-scope asset
          </Button>

          <div className="space-y-2 pt-2">
            <Label htmlFor="prohibited">
              Prohibited activities <span className="text-muted-foreground">(one per line)</span>
            </Label>
            <Textarea id="prohibited" rows={4} value={prohibited} onChange={(e) => setProhibited(e.target.value)}
              placeholder={"Social engineering\nPhysical attacks\nAutomated scanners against production"} />
            <input type="hidden" name="prohibited" value={JSON.stringify(
              prohibited.split("\n").map((s) => s.trim()).filter(Boolean)
            )} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="hidden" name="severityRewards" value={JSON.stringify(severityRewards)} />
          <div className="grid gap-4 sm:grid-cols-5">
            {SEVERITIES.map((s) => (
              <div key={s} className="space-y-2">
                <Label htmlFor={`reward-${s}`} className="text-xs text-muted-foreground">
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Label>
                <Input
                  id={`reward-${s}`}
                  type="number"
                  min={0}
                  value={severityRewards[s] ?? 0}
                  onChange={(e) =>
                    setSeverityRewards((prev) => ({ ...prev, [s]: Math.max(0, Number(e.target.value || 0)) }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="categories" value={JSON.stringify(categories)} />
          <div className="flex flex-wrap gap-2">
            {VULN_CATEGORIES.map((c) => {
              const active = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {categories.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Select at least one category.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policy &amp; requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rules">Program rules</Label>
            <Textarea id="rules" name="rules" rows={5} defaultValue={program?.rules ?? ""}
              placeholder="Any additional rules researchers must follow." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submissionRequirements">Submission requirements</Label>
            <Textarea id="submissionRequirements" name="submissionRequirements" rows={4}
              defaultValue={program?.submissionRequirements ?? ""}
              placeholder="e.g. Detailed PoC required, video for mobile issues, etc." />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : program?.id ? "Save changes" : "Create program"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/org/programs")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
