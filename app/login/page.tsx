import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/app/login-form";
import { LogoMark } from "@/components/app/logo";

export const metadata: Metadata = { title: "ورود" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const params = await searchParams;
  const callbackUrl = params.callbackUrl?.startsWith("/") ? params.callbackUrl : "/dashboard";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="animate-scale-in w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <LogoMark className="h-9 w-9" />
          <h1 className="mt-3 text-lg font-bold">ورود به BugFa</h1>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
        <p className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
          حساب ندارید؟{" "}
          <Link href="/register" className="text-primary hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </div>
  );
}
