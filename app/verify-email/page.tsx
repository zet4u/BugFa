import type { Metadata } from "next";
import { VerifyEmailView } from "@/components/app/verify-email-view";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (!params.token) {
    return (
      <div className="container-app max-w-md py-16">
        <p className="text-sm text-destructive">Missing verification token.</p>
      </div>
    );
  }
  return (
    <div className="container-app max-w-md py-16">
      <VerifyEmailView token={params.token} />
    </div>
  );
}
