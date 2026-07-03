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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    window.history.replaceState(null, "", href);
  };

  return (
    <a className={className} href={href} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </a>
  );
}
