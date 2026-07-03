"use client";

import Link from "next/link";
import type { MouseEvent, SVGProps } from "react";
import { useState } from "react";

type AdminSectionLink = {
  description: string;
  href: string;
  key: string;
  label: string;
};

type AdminSectionNavProps = {
  activeSection: string;
  sections: AdminSectionLink[];
};

export function AdminSectionNav({ activeSection, sections }: AdminSectionNavProps) {
  const [pendingState, setPendingState] = useState<{ from: string; key: string } | null>(null);
  const pendingKey = pendingState?.from === activeSection ? pendingState.key : null;
  const visualSection = pendingKey ?? activeSection;

  function handleClick(event: MouseEvent<HTMLAnchorElement>, section: AdminSectionLink) {
    if (isModifiedClick(event) || section.key === activeSection) {
      return;
    }

    setPendingState({ from: activeSection, key: section.key });
    window.setTimeout(() => {
      setPendingState((current) => (current?.from === activeSection && current.key === section.key ? null : current));
    }, 12000);
  }

  return (
    <nav className="admin-tab-nav" aria-label="관리 메뉴" aria-busy={pendingKey !== null}>
      {sections.map((section) => {
        const isPending = pendingKey === section.key;

        return (
          <Link
            aria-current={activeSection === section.key ? "page" : undefined}
            className="admin-tab-link"
            data-active={visualSection === section.key ? "true" : undefined}
            data-pending={isPending ? "true" : undefined}
            href={section.href}
            key={section.key}
            onClick={(event) => handleClick(event, section)}
            prefetch={false}
            title={section.description}
          >
            {isPending ? <span className="admin-tab-loading-icon" aria-hidden="true" /> : <AdminSectionIcon sectionKey={section.key} />}
            <span className="admin-tab-label">{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminSectionIcon({ sectionKey }: { sectionKey: string }) {
  const iconProps: SVGProps<SVGSVGElement> = {
    "aria-hidden": true,
    className: "admin-tab-icon",
    fill: "none",
    focusable: "false",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    viewBox: "0 0 24 24"
  };

  if (sectionKey === "profile") {
    return (
      <svg {...iconProps}>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  if (sectionKey === "schedules") {
    return (
      <svg {...iconProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="3" width="18" x="3" y="4" />
        <path d="M3 10h18" />
        <path d="M12 14v6" />
        <path d="M9 17h6" />
      </svg>
    );
  }

  if (sectionKey === "manage-schedules") {
    return (
      <svg {...iconProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="3" width="18" x="3" y="4" />
        <path d="M3 10h18" />
        <path d="M8 15h.01" />
        <path d="M12 15h.01" />
        <path d="M16 15h.01" />
      </svg>
    );
  }

  if (sectionKey === "manage-posts") {
    return (
      <svg {...iconProps}>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
