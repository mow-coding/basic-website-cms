export const publicSiteContentCacheSeconds = 60;
export const publicSiteContentCacheTag = "public-site-content";
export const publicSiteFetchTimeoutMs = 3000;

export const publicSiteRevalidationPaths = [
  { path: "/" },
  { path: "/single" },
  { path: "/nested" },
  { path: "/nested/[slug]", type: "page" as const },
  { path: "/sitemap.xml" }
] as const;
