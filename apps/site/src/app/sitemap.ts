import type { MetadataRoute } from "next";
import { loadPublicSiteContent } from "@/lib/public-site-content";
import { siteConfig } from "@/lib/site-data";

const staticRoutes = ["", "/single", "/nested", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const content = await loadPublicSiteContent({ includeNotices: false });
  const routes: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.domain}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...content.workshops.map((workshop) => ({
      url: `${siteConfig.domain}/nested/${workshop.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return routes;
}
