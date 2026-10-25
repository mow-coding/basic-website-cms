import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("documented CLI environment loading", () => {
  it("loads .env.local in a clean app and preserves shell priority", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "cms-env-regression-"));
    try {
      mkdirSync(path.join(root, "scripts"));
      copyFileSync(fileURLToPath(new URL("../scripts/with-env.mjs", import.meta.url)), path.join(root, "scripts/with-env.mjs"));
      symlinkSync(realpathSync(fileURLToPath(new URL("../node_modules", import.meta.url))), path.join(root, "node_modules"), "junction");
      writeFileSync(path.join(root, ".env.local"), "CMS_ENV_FIXTURE=from-file\nDATABASE_URL=postgresql://fixture:fixture@127.0.0.1:1/fixture\n");
      writeFileSync(path.join(root, "probe.cjs"), "process.stdout.write(process.env.CMS_ENV_FIXTURE || 'missing')");
      const childEnv: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "development", CHECKPOINT_DISABLE: "1", PRISMA_HIDE_UPDATE_MESSAGE: "1" };
      delete childEnv.CMS_ENV_FIXTURE;
      delete childEnv.DATABASE_URL;
      expect(execFileSync(process.execPath, ["scripts/with-env.mjs", "node", "probe.cjs"], { cwd: root, env: childEnv, encoding: "utf8" })).toBe("from-file");
      expect(execFileSync(process.execPath, ["scripts/with-env.mjs", "node", "probe.cjs"], { cwd: root, env: { ...childEnv, CMS_ENV_FIXTURE: "from-shell" }, encoding: "utf8" })).toBe("from-shell");
      mkdirSync(path.join(root, "prisma"));
      copyFileSync(fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)), path.join(root, "prisma/schema.prisma"));
      expect(execFileSync(process.execPath, ["scripts/with-env.mjs", "prisma", "validate"], { cwd: root, env: childEnv, encoding: "utf8" })).toContain("is valid");
    } finally {
      const resolved = path.resolve(root);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith("cms-env-regression-")) throw new Error("Invalid owned fixture directory");
      rmSync(resolved, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    }
  });
});
