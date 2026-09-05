export const env = {
  SITE_ADMIN_API_URL: process.env.SITE_ADMIN_API_URL?.trim() ?? "",
  SITE_REVALIDATE_SECRET: process.env.SITE_REVALIDATE_SECRET?.trim() ?? ""
};
