import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/lib/env";
import { isAllowedSiteAdminEmail } from "@/lib/site-admin/allowed-users";

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
    async signIn({ user }) {
      return isAllowedSiteAdminEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }

      return session;
    }
  }
};
