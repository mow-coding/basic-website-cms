import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const [command, ...args] = process.argv.slice(2);
if (command !== "prisma" && command !== "node") {
  throw new Error("Expected prisma or node; environment values are never printed.");
}
nextEnv.loadEnvConfig(appRoot, process.env.NODE_ENV !== "production", { info() {}, error() {} });
const require = createRequire(import.meta.url);
const entry = command === "prisma" ? require.resolve("prisma/build/index.js") : args.shift();
if (!entry) throw new Error("A script is required.");
const child = spawn(process.execPath, [entry, ...args], { cwd: appRoot, env: process.env, stdio: "inherit" });
child.on("error", () => { console.error("Unable to start the database command."); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1); });
