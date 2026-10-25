export const AUTH_VERSION = 2;

export type AuthIdentity = {
  authVersion: 2;
  authProvider: "google" | "demo";
  userId?: string;
  googleSubject?: string;
};

export function validAuthIdentity<T>(value: T, demoEnabled = false): value is T & AuthIdentity {
  if (!value || typeof value !== "object") return false;
  const identity = value as Record<string, unknown>;
  if (identity.authVersion !== AUTH_VERSION) return false;
  if (identity.authProvider === "demo") return demoEnabled;
  return identity.authProvider === "google" && typeof identity.userId === "string" && !!identity.userId &&
    typeof identity.googleSubject === "string" && !!identity.googleSubject;
}
