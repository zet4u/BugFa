"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordResetAction } from "@/lib/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(passwordResetAction, null);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-emerald-400">{state.success}</p>
        <Button asChild className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={10} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
