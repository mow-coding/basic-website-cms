import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { verifiedGoogleIdentity } from "@/lib/google-identity";
import { AUTH_VERSION, validAuthIdentity } from "@/lib/auth-session";
import { linkGoogleAccount } from "@/lib/google-account";

function buildProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [];

  if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  // Production deployments must use secure cookies even when NEXTAUTH_URL is omitted.
  useSecureCookies: env.IS_PRODUCTION,
  providers: buildProviders(),
  pages: {
    signIn: "/signin",
    error: "/signin"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;
      const identity = verifiedGoogleIdentity(profile, account.providerAccountId);
      if (!identity) return false;
      try {
        const appUser = await linkGoogleAccount(identity);
        user.id = appUser.id;
        user.email = identity.email;
        return true;
      } catch {
        console.error("[auth] Google account could not be linked");
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user && account?.provider === "google") {
        const identity = verifiedGoogleIdentity(profile, account.providerAccountId);
        if (!identity) return {};
        const linked = await db.user.findFirst({ where: { email: identity.email, googleSubject: identity.subject }, select: { id: true } });
        if (!linked) return {};
        token.authVersion = AUTH_VERSION;
        token.authProvider = "google";
        token.userId = linked.id;
        token.googleSubject = identity.subject;
        token.email = identity.email;
        token.name = user.name;
      }

      return validAuthIdentity(token) ? token : {};
    },
    async session({ session, token }) {
      if (session.user && validAuthIdentity(token)) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.authVersion = AUTH_VERSION;
        session.user.authProvider = token.authProvider;
        session.user.userId = token.userId;
        session.user.googleSubject = token.googleSubject;
      } else {
        session.user = undefined;
      }

      return session;
    }
  }
};
