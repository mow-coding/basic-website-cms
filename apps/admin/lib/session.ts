import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type AppUser = {
  email: string;
  name?: string;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return {
    email: session.user.email,
    name: session.user.name ?? undefined
  };
}
