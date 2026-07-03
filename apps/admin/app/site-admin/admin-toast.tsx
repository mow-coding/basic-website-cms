"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AdminToastProps = {
  clearUrlState?: boolean;
  message: string;
  tone: "error" | "success";
};

type ToastPhase = "closing" | "closed" | "open";

export function AdminToast({ clearUrlState = true, message, tone }: AdminToastProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<ToastPhase>("open");

  const clearUrl = useCallback(() => {
    if (!clearUrlState) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("message");
    nextParams.delete("error");

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [clearUrlState, pathname, router, searchParams]);

  const dismiss = useCallback(() => {
    setPhase((current) => (current === "open" ? "closing" : current));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(dismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  useEffect(() => {
    if (phase !== "closing") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPhase("closed");
      clearUrl();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [clearUrl, phase]);

  if (!message || phase === "closed") {
    return null;
  }

  const className = [
    "admin-toast",
    tone === "success" ? "admin-toast-success" : "admin-toast-error",
    phase === "closing" ? "admin-toast-closing" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-live="polite" role="status">
      <p>{message}</p>
      <button className="admin-toast-close" type="button" aria-label="알림 닫기" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
