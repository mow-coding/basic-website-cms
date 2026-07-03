import { redirect } from "next/navigation";
import { resolveSiteAdminAccess } from "@/lib/site-admin/access";

export default async function HomePage() {
  const access = await resolveSiteAdminAccess();

  redirect(access ? "/site-admin" : "/signin");
}
