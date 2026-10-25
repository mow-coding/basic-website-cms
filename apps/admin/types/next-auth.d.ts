import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      authVersion?: number;
      authProvider?: "google" | "demo";
      userId?: string;
      googleSubject?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authVersion?: number;
    authProvider?: "google" | "demo";
    userId?: string;
    googleSubject?: string;
  }
}
