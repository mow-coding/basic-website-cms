import { db } from "@/lib/db";
import { getCurrentUser, type AppUser } from "@/lib/session";
import {
  canManageSiteSystemSettings,
  getSiteAdminAccount,
  isAllowedSiteAdminEmail
} from "@/lib/site-admin/allowed-users";

export type SiteAdminAccess = {
  user: AppUser;
  appUserId: string;
  displayName: string;
  canManageSystemSettings: boolean;
};

export async function resolveSiteAdminAccess(): Promise<SiteAdminAccess | null> {
  const user = await getCurrentUser();
  if (!user || !isAllowedSiteAdminEmail(user.email)) {
    return null;
  }

  const account = getSiteAdminAccount(user.email);
  const existingUser = await db.user.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      authorProfile: {
        select: {
          displayName: true
        }
      }
    }
  });

  if (existingUser?.authorProfile) {
    return {
      user,
      appUserId: existingUser.id,
      displayName: existingUser.authorProfile.displayName,
      canManageSystemSettings: canManageSiteSystemSettings(user.email)
    };
  }

  const defaultDisplayName = account?.defaultDisplayName ?? user.name ?? "관리자";

  if (existingUser) {
    const profile = await db.authorProfile.upsert({
      where: {
        userId: existingUser.id
      },
      create: {
        userId: existingUser.id,
        displayName: defaultDisplayName
      },
      update: {}
    });

    return {
      user,
      appUserId: existingUser.id,
      displayName: profile.displayName,
      canManageSystemSettings: canManageSiteSystemSettings(user.email)
    };
  }

  const appUser = await db.user.create({
    data: {
      email: user.email,
      name: user.name ?? account?.defaultDisplayName,
      authorProfile: {
        create: {
          displayName: defaultDisplayName
        }
      }
    },
    select: {
      id: true,
      authorProfile: {
        select: {
          displayName: true
        }
      }
    }
  });

  return {
    user,
    appUserId: appUser.id,
    displayName: appUser.authorProfile?.displayName ?? defaultDisplayName,
    canManageSystemSettings: canManageSiteSystemSettings(user.email)
  };
}

export async function requireSiteAdminAccess(): Promise<SiteAdminAccess> {
  const access = await resolveSiteAdminAccess();
  if (!access) {
    throw new Error("SITE_ADMIN_ACCESS_DENIED");
  }

  return access;
}
