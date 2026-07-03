import Link from "next/link";
import Image from "next/image";
import { HeaderScrollState } from "@/components/header-scroll-state";
import { researchSurveyHref } from "@/lib/site-data";

type NavigationItem = {
  label: string;
  href: string;
  external?: boolean;
  children?: {
    label: string;
    href: string;
  }[];
};

const primaryNavigation = [
  { label: "단일", href: "/single" },
  {
    label: "중첩",
    href: "/nested",
    children: [
      { label: "프로그램 A", href: "/nested/program-a" },
      { label: "프로그램 B", href: "/nested/program-b" },
      { label: "프로그램 C", href: "/nested/program-c" },
      { label: "프로그램 D", href: "/nested/program-d" },
    ],
  },
  { label: "외부", href: researchSurveyHref, external: true },
] satisfies NavigationItem[];

function HeaderNavLink({ item }: { item: NavigationItem }) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer">
        {item.label}
      </a>
    );
  }

  return <Link href={item.href}>{item.label}</Link>;
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <HeaderScrollState />

      <div className="site-nav-shell">
        <Link className="brand" href="/" aria-label="모오 임상심리연구소 메인으로 이동">
          <span className="brand-mark" aria-hidden="true">
            <Image src="/brand-icon-deep.png" alt="" width={63} height={40} priority />
          </span>
          <span>
            <strong>모오 임상심리연구소</strong>
            <small>MOW Institute of Clinical Psychology</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {primaryNavigation.map((item) =>
            item.children ? (
              <div className="nav-group" key={item.href}>
                <Link href={item.href}>{item.label}</Link>
                <div className="nav-popover" aria-label={`${item.label} 하위 메뉴`}>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <HeaderNavLink key={item.href} item={item} />
            ),
          )}
        </nav>

        <details className="mobile-nav">
          <summary>메뉴</summary>
          <div className="mobile-nav-panel">
            {primaryNavigation.map((item) => (
              <div className="mobile-nav-group" key={item.href}>
                <HeaderNavLink item={item} />
                {item.children ? (
                  <div className="mobile-subnav">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
