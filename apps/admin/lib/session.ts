import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { validAuthIdentity, type AuthIdentity } from "@/lib/auth-session";

export type AppUser = AuthIdentity & {
  email: string;
  name?: string;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !validAuthIdentity(session.user)) {
    return null;
  }

  return {
    authVersion: 2,
    authProvider: session.user.authProvider,
    userId: session.user.userId,
    googleSubject: session.user.googleSubject,
    email: session.user.email,
    name: session.user.name ?? undefined
  };
}
