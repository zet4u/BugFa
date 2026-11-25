import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, ".data", "pg");
const pidFile = path.join(root, ".data", "pg.pid");

const platformDir =
  process.platform === "win32"
    ? "windows-x64"
    : process.platform === "darwin"
      ? process.arch === "arm64"
        ? "darwin-arm64"
        : "darwin-x64"
      : "linux-x64";

const pgCtl = path.join(
  root,
  "node_modules",
  "@embedded-postgres",
  platformDir,
  "native",
  "bin",
  process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl"
);

if (!fs.existsSync(pidFile)) {
  console.log("No running instance recorded.");
  process.exit(0);
}

try {
  execFileSync(pgCtl, ["-D", dataDir, "stop", "-m", "fast"], {
    stdio: "ignore",
  });
} catch {}
fs.rmSync(pidFile, { force: true });
console.log("Stopped.");
