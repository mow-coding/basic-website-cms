import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);
const optionalEnvUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: optionalEnvString,
  NEXTAUTH_SECRET: optionalEnvString,
  NEXT_PUBLIC_SITE_URL: optionalEnvString,
  GOOGLE_OAUTH_CLIENT_ID: optionalEnvString,
  GOOGLE_OAUTH_CLIENT_SECRET: optionalEnvString,
  BLOB_READ_WRITE_TOKEN: optionalEnvString,
  SITE_REVALIDATE_URL: optionalEnvUrl,
  SITE_REVALIDATE_SECRET: optionalEnvString
});

const raw = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  SITE_REVALIDATE_URL: process.env.SITE_REVALIDATE_URL,
  SITE_REVALIDATE_SECRET: process.env.SITE_REVALIDATE_SECRET
});

const requiredProductionEnvKeys = ["NEXTAUTH_SECRET"] as const;

if (raw.NODE_ENV === "production") {
  for (const key of requiredProductionEnvKeys) {
    if (!raw[key]) {
      throw new Error(`Missing required production env: ${key}`);
    }
  }
}

export const env = {
  ...raw,
  IS_PRODUCTION: raw.NODE_ENV === "production"
};
