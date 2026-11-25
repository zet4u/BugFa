"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/lib/actions/auth";
import { MailCheck as EmailCheck } from "lucide-react";

export function VerifyEmailView({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown) => verifyEmailAction(token),
    null
  );

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <EmailCheck className="h-10 w-10 text-primary" />
      <h1 className="text-xl font-bold">Email verification</h1>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? (
        <>
          <p className="text-sm text-emerald-400">Your email has been verified.</p>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </>
      ) : !state ? (
        <form action={formAction}>
          <Button type="submit" disabled={pending}>
            {pending ? "Verifying…" : "Verify my email"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
