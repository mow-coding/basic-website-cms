"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

type ProgressState = "idle" | "pending" | "settling";

const settleDelayMs = 220;
const maxPendingMs = 12000;

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProgressState>("idle");
  const maxTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const finishProgress = useCallback(() => {
    pendingRef.current = false;
    clearTimer(maxTimerRef);
    clearTimer(settleTimerRef);
    setState((current) => (current === "idle" ? "idle" : "settling"));
    settleTimerRef.current = window.setTimeout(() => setState("idle"), settleDelayMs);
  }, []);

  const startProgress = useCallback(() => {
    pendingRef.current = true;
    clearTimer(maxTimerRef);
    clearTimer(settleTimerRef);
    setState("pending");
    maxTimerRef.current = window.setTimeout(finishProgress, maxPendingMs);
  }, [finishProgress]);

  useEffect(() => {
    if (pendingRef.current) {
      finishProgress();
    }
  }, [finishProgress, pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainPrimaryClick(event)) {
        return;
      }

      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || !shouldTrackLink(link)) {
        return;
      }

      startProgress();
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) {
        return;
      }

      const target = event.target.getAttribute("target");
      const method = event.target.getAttribute("method")?.toLowerCase();
      if ((target && target !== "_self") || method === "dialog") {
        return;
      }

      startProgress();
    };

    window.addEventListener("click", handleClick, true);
    window.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", finishProgress);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", finishProgress);
      clearTimer(maxTimerRef);
      clearTimer(settleTimerRef);
    };
  }, [finishProgress, startProgress]);

  return <div className="navigation-progress" data-state={state} aria-hidden="true" />;
}

function shouldTrackLink(link: HTMLAnchorElement) {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || link.hasAttribute("download")) {
    return false;
  }

  if (link.target && link.target !== "_self") {
    return false;
  }

  const nextUrl = new URL(link.href, window.location.href);
  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const nextPath = `${nextUrl.pathname}${nextUrl.search}`;
  return nextPath !== currentPath;
}

function isPlainPrimaryClick(event: MouseEvent) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;
}

function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
