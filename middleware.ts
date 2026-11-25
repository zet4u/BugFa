import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_PREFIXES: Record<string, string> = {
  "/researcher": "RESEARCHER",
  "/org": "ORGANIZATION",
  "/admin": "ADMIN",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  for (const [prefix, role] of Object.entries(ROLE_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!req.auth?.user) {
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
      const userRole = (req.auth.user as any).role;
      if (userRole !== role && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  if (pathname === "/dashboard" && !req.auth?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", "/dashboard");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/researcher/:path*", "/org/:path*", "/admin/:path*", "/dashboard/:path*"],
};
