import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/app/login-form";

export const metadata: Metadata = { title: "Log in" };

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
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log in to your BugFa account to continue hunting.
      </p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
