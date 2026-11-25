"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  updateOrgProfileAction,
  inviteTeamMemberAction,
  acceptInviteAction,
} from "@/lib/actions/org";
import type { ActionState } from "@/lib/actions/auth";

export function OrgProfileForm({
  org,
}: {
  org: { name: string; description: string; website: string; twitter: string };
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateOrgProfileAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}
          {state?.success ? (
            <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {state.success}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" name="name" required minLength={2} maxLength={80} defaultValue={org.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={org.description}
              placeholder="What does your organization build?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" defaultValue={org.website}
                placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter handle</Label>
              <Input id="twitter" name="twitter" defaultValue={org.twitter} placeholder="@example" />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    inviteTeamMemberAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite a team member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}
          {state?.success ? (
            <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {state.success}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="email">Email of an organization account</Label>
              <Input id="email" name="email" type="email" required placeholder="colleague@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="MEMBER">
                <SelectTrigger id="role" aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="TRIAGER">Triager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Inviting…" : "Invite"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The invitee must already have an organization account on BugFa with this email.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function PendingInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    acceptInviteAction,
    null
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Joining…" : "Accept invite"}
      </Button>
    </form>
  );
}
