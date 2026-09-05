import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const rules = [
  ["local home path", /(?:[a-z]:[\\/]+Users[\\/]+|\/(?:Users|home)\/)([^\\/\s"'<>]+)/gi],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/g],
  ["Blob token", /\bvercel_blob_rw_[A-Za-z0-9]+_[A-Za-z0-9]{20,}\b/g],
  ["Google OAuth secret", /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/g]
];
const examples = new Set(["YOUR_NAME", "YOUR_USERNAME", "USERNAME", "username", "user", "example", "runner"]);
const findings = [];
for (const file of files) {
  let body;
  try { body = readFileSync(file).toString("utf8"); } catch { continue; }
  if (/(^|\/)\.env(?:\.(?:local|production|development))?$|(?:^|\/)(?:backup|_tmp_backup)[^/]*\.json$/i.test(file)) {
    findings.push({file, rule:"private runtime file"});
  }
  for (const [rule, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of body.matchAll(pattern)) {
      if (rule === "local home path" && examples.has(match[1])) continue;
      findings.push({file, rule, line:body.slice(0,match.index).split("\n").length});
    }
  }
}
for (const finding of findings) console.error(JSON.stringify(finding));
if (findings.length) process.exitCode = 1;
else console.log("Public privacy guard passed for " + files.length + " tracked files.");
