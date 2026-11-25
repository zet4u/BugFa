import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/app/login-form";

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
    <div className="container-app flex max-w-md flex-col justify-center py-16">
      <h1 className="text-2xl font-bold animate-fade-up">خوش آمدید</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        برای ادامه شکار، وارد حساب BugFa خود شوید.
      </p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        حساب ندارید؟{" "}
        <Link href="/register" className="text-primary hover:underline">
          ثبت‌نام
        </Link>
      </p>
    </div>
  );
}
