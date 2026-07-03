"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function HeaderScrollState() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const isHome = pathname === "/";
    let scrollStart = 36;
    let scrollDistance = 520;
    let smoothingDuration = 360;
    let animationFrame = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let previousTime = performance.now();
    let lastProgress = "";

    const updateScrollSettings = () => {
      if (isHome) {
        scrollStart = 36;
        scrollDistance = 520;
        smoothingDuration = 360;
        return;
      }

      const pageHero = document.querySelector<HTMLElement>("main > .page-hero");
      const pageHeroHeight = pageHero?.getBoundingClientRect().height ?? 400;

      scrollStart = 18;
      scrollDistance = Math.min(320, Math.max(240, pageHeroHeight * 0.62));
      smoothingDuration = 300;
    };

    const getScrollProgress = () => {
      const rawProgress = Math.min(1, Math.max(0, (window.scrollY - scrollStart) / scrollDistance));
      return rawProgress * rawProgress * (3 - 2 * rawProgress);
    };

    const writeProgress = (progress: number) => {
      const nextProgress = progress.toFixed(3);

      if (nextProgress !== lastProgress) {
        root.style.setProperty("--site-nav-progress", nextProgress);
        lastProgress = nextProgress;
      }
    };

    const animateHeader = (time: number) => {
      const elapsed = Math.min(64, Math.max(0, time - previousTime));
      previousTime = time;
      const smoothing = 1 - Math.exp(-elapsed / smoothingDuration);

      currentProgress += (targetProgress - currentProgress) * smoothing;

      if (Math.abs(targetProgress - currentProgress) < 0.0005) {
        currentProgress = targetProgress;
      }

      writeProgress(currentProgress);

      if (currentProgress !== targetProgress) {
        animationFrame = window.requestAnimationFrame(animateHeader);
      } else {
        animationFrame = 0;
      }
    };

    const scheduleHeaderUpdate = () => {
      targetProgress = getScrollProgress();

      if (!animationFrame) {
        previousTime = performance.now();
        animationFrame = window.requestAnimationFrame(animateHeader);
      }
    };

    const handleResize = () => {
      updateScrollSettings();
      scheduleHeaderUpdate();
    };

    updateScrollSettings();
    targetProgress = getScrollProgress();
    currentProgress = targetProgress;
    writeProgress(currentProgress);

    const initialScrollCheck = window.setTimeout(scheduleHeaderUpdate, 80);
    window.addEventListener("scroll", scheduleHeaderUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.clearTimeout(initialScrollCheck);
      window.removeEventListener("scroll", scheduleHeaderUpdate);
      window.removeEventListener("resize", handleResize);
      root.style.removeProperty("--site-nav-progress");
    };
  }, [pathname]);

  return null;
}
