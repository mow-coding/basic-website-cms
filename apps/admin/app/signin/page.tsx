import Image from "next/image";
import { env } from "@/lib/env";
import SignInForm from "./signin-form";

export default function SignInPage() {
  const googleEnabled = Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

  return (
    <main className="signin-hero-shell" id="main-content">
      <h1 className="sr-only">Basic Website CMS 관리자 로그인</h1>

      <section className="signin-panel signin-panel-minimal" aria-label="관리자 로그인">
        <div className="signin-panel-brand signin-panel-brand-icon" aria-hidden="true">
          <Image src="/icon.png" alt="" width={44} height={44} priority />
        </div>
        <SignInForm googleEnabled={googleEnabled} />
      </section>
    </main>
  );
}
