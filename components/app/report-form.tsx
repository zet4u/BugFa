"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReportAction } from "@/lib/actions/reports";
import { VULN_CATEGORIES, SEVERITIES } from "@/lib/constants";

export function ReportForm({ programId, programTitle }: { programId: string; programTitle: string }) {
  const [state, formAction, pending] = useActionState(submitReportAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(state.success);
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="programId" value={programId} />
      {state?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Vulnerability details</h2>
        <p className="text-xs text-muted-foreground">
          A clear title and precise reproduction steps get triaged faster.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={8} maxLength={160}
          placeholder="e.g. Stored XSS in user profile bio field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="asset">Affected asset</Label>
          <Input id="asset" name="asset" required placeholder="https://app.example.com/profile" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select name="severity" defaultValue="MEDIUM" required>
            <SelectTrigger id="severity" aria-label="Severity">
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
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" required>
            <SelectTrigger id="category" aria-label="Category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {VULN_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed description</Label>
        <Textarea id="description" name="description" required minLength={50} rows={5}
          placeholder="What is the vulnerability and which component does it affect?" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">Steps to reproduce</Label>
        <Textarea id="steps" name="steps" required minLength={20} rows={6}
          placeholder={"1. Go to…\n2. Enter…\n3. Observe…"} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="impact">Impact</Label>
        <Textarea id="impact" name="impact" required minLength={20} rows={3}
          placeholder="What could an attacker achieve with this issue?" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proofOfConcept">Proof of Concept (optional)</Label>
        <Textarea id="proofOfConcept" name="proofOfConcept" rows={5}
          className="font-mono text-xs"
          placeholder="Paste PoC code, request/response snippets or payloads here" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remediation">Suggested remediation (optional)</Label>
        <Textarea id="remediation" name="remediation" rows={3} />
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Submitting…" : `Submit report to ${programTitle}`}
      </Button>
    </form>
  );
}
