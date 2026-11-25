import type { Metadata } from "next";
import { VerifyEmailView } from "@/components/app/verify-email-view";

export const metadata: Metadata = { title: "تأیید ایمیل" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  if (!params.token) {
    return (
      <div className="container-app max-w-md py-16">
        <p className="text-sm text-destructive">توکن تأیید یافت نشد.</p>
      </div>
    );
  }
  return (
    <div className="container-app max-w-md py-16">
      <VerifyEmailView token={params.token} />
    </div>
  );
}
