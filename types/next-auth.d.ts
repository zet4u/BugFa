import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "RESEARCHER" | "ORGANIZATION" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "RESEARCHER" | "ORGANIZATION" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "RESEARCHER" | "ORGANIZATION" | "ADMIN";
  }
}
