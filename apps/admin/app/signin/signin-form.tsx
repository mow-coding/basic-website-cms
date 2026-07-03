"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  googleEnabled: boolean;
  demoEnabled: boolean;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="google-signin-icon" viewBox="0 0 18 18" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.94a9 9 0 0 0 0 8.08l3.02-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function SignInForm({ googleEnabled, demoEnabled }: SignInFormProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  function onGoogleSignIn() {
    if (googleLoading || demoLoading) {
      return;
    }

    setGoogleLoading(true);

    void signIn("google", {
      callbackUrl: "/site-admin"
    }).catch(() => {
      setGoogleLoading(false);
    });
  }

  function onDemoSignIn() {
    if (googleLoading || demoLoading) {
      return;
    }

    setDemoLoading(true);

    void signIn("demo", {
      callbackUrl: "/site-admin"
    }).catch(() => {
      setDemoLoading(false);
    });
  }

  if (!googleEnabled && !demoEnabled) {
    return (
      <p className="error-text" role="alert">
        Google 로그인을 사용할 수 없습니다.
      </p>
    );
  }

  return (
    <div className="signin-button-stack">
      {googleEnabled ? (
        <button className="google-signin-button" type="button" disabled={googleLoading} aria-busy={googleLoading} onClick={onGoogleSignIn}>
          <span className="google-signin-icon-box">{googleLoading ? <span className="google-signin-spinner" aria-hidden="true" /> : <GoogleIcon />}</span>
          <span>{googleLoading ? "로그인 화면으로 이동 중..." : "Google 계정으로 로그인"}</span>
        </button>
      ) : null}
      {demoEnabled ? (
        <button
          className="google-signin-button demo-signin-button"
          type="button"
          disabled={demoLoading}
          aria-busy={demoLoading}
          onClick={onDemoSignIn}
        >
          <span>{demoLoading ? "데모 계정으로 입장 중..." : "데모 계정으로 로그인 (개발 모드)"}</span>
        </button>
      ) : null}
    </div>
  );
}
