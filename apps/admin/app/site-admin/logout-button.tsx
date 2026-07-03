"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await signOut({ callbackUrl: `${window.location.origin}/signin` });
    } catch {
      setPending(false);
    }
  }

  return (
    <button className="button-secondary" type="button" disabled={pending} aria-busy={pending} onClick={handleLogout}>
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
