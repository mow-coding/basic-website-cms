import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

if (!process.argv.includes("--backup-verified")) {
  console.error("Restore-test your backup first. Then run npm run admin:db:baseline -- --backup-verified.");
  process.exit(1);
}
const require = createRequire(import.meta.url);
const prisma = require.resolve("prisma/build/index.js");
function run(args) {
  const child = spawnSync(process.execPath, [prisma, ...args], { env: process.env, stdio: "inherit" });
  if (child.status !== 0) process.exit(child.status ?? 1);
}
// Never mark a mismatched database as initialized. Exit 2 means schema drift.
run(["migrate", "diff", "--from-schema-datasource", "prisma/baseline.prisma", "--to-schema-datamodel", "prisma/baseline.prisma", "--exit-code"]);
run(["migrate", "resolve", "--applied", "0_init"]);
