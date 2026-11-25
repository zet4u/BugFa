import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const pidFile = path.join(process.cwd(), ".data", "pg.pid");
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, "utf8").trim();
  const bin = path.join(
    process.cwd(),
    "node_modules",
    "@embedded-postgres",
    "linux-x64",
    "native",
    "bin"
  );
  try {
    execSync(
      `"${bin}/pg_ctl" -D "${path.join(process.cwd(), ".data", "pg")}" stop -m fast`,
      { stdio: "ignore" }
    );
  } catch {
    try {
      execSync(`kill ${pid}`);
    } catch {}
  }
  fs.rmSync(pidFile, { force: true });
  console.log("Stopped.");
} else {
  console.log("No running instance recorded.");
}
