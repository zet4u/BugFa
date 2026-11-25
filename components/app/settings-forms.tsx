"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/profile";
import { resendVerificationAction } from "@/lib/actions/auth";

export function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p className={`text-sm ${tone === "error" ? "text-destructive" : "text-emerald-400"}`}>{children}</p>
  );
}

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; username: string; bio: string; country: string; website: string; github: string; twitter: string };
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={defaults.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={defaults.username} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={defaults.bio} rows={3} maxLength={600} placeholder="Short public bio (shown on your public profile)" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={defaults.country} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={defaults.website} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="github">GitHub username</Label>
          <Input id="github" name="github" defaultValue={defaults.github} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter">X / Twitter username</Label>
          <Input id="twitter" name="twitter" defaultValue={defaults.twitter} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}

export function ResendVerification() {
  const [state, formAction, pending] = useActionState(async () => resendVerificationAction(), null);

  return (
    <form action={formAction} className="space-y-2">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? (
        <Alert tone="success">{state.success} In development, the link is printed in the server console.</Alert>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
