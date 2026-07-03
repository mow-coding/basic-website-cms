"use client";

import type { MouseEvent, ReactNode } from "react";

type SmoothScrollLinkProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  href: `#${string}`;
};

export function SmoothScrollLink({ ariaLabel, children, className, href }: SmoothScrollLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(href);

    if (!target) {
      return;
    }

    event.preventDefault();

    const header = document.querySelector<HTMLElement>(".site-header");
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const extraBreathingRoom = 18;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - extraBreathingRoom;

    animateScrollTo(Math.max(0, targetTop));
    window.history.replaceState(null, "", href);
  };

  return (
    <a className={className} href={href} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </a>
  );
}

function animateScrollTo(targetTop: number) {
  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const duration = 860;
  const startTime = performance.now();

  const step = (time: number) => {
    const elapsed = time - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startTop + distance * easedProgress);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}
