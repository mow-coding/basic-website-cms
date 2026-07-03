import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/lib/env";
import { isAllowedSiteAdminEmail } from "@/lib/site-admin/allowed-users";

// 개발 모드 전용 데모 로그인. 프로덕션에서는 어떤 설정으로도 켤 수 없다 —
// 이 템플릿을 그대로 배포해도 관리자 콘솔이 열리지 않도록 코드 레벨에서 막는다.
export const demoLoginEnabled = env.NODE_ENV === "development";

const demoAccount = {
  id: "demo-admin",
  email: "admin@example.com",
  name: "관리자"
};

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

  if (demoLoginEnabled) {
    providers.push(
      CredentialsProvider({
        id: "demo",
        name: "데모 계정",
        credentials: {},
        async authorize() {
          return demoAccount;
        }
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
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
