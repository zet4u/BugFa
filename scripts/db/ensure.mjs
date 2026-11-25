import { execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const dataDir = path.join(root, ".data", "pg");
const port = Number(process.env.PGPORT ?? 54329);
const host = "127.0.0.1";
const logfile = path.join(root, ".data", "pg.log");
const user = "bugfa";
const password = "bugfa";
const database = "bugfa";

const platformDir =
  process.platform === "win32"
    ? "windows-x64"
    : process.platform === "darwin"
      ? process.arch === "arm64"
        ? "darwin-arm64"
        : "darwin-x64"
      : "linux-x64";

const ext = process.platform === "win32" ? ".exe" : "";
const bindir = path.join(root, "node_modules", "@embedded-postgres", platformDir, "native", "bin");
const initdb = path.join(bindir, `initdb${ext}`);
const pgCtl = path.join(bindir, `pg_ctl${ext}`);
const createdb = path.join(bindir, `createdb${ext}`);

function probePort(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function waitForPort(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probePort(800)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function clearStalePidFiles() {
  for (const file of [
    path.join(dataDir, "postmaster.pid"),
    path.join(dataDir, "postmaster.opts"),
  ]) {
    try {
      fs.rmSync(file, { force: true });
    } catch {}
  }
}

function run(file, args, opts = {}) {
  execFileSync(file, args, { stdio: "inherit", ...opts });
}

if (await probePort()) {
  console.log(`PostgreSQL already running on port ${port}`);
  process.exit(0);
}

if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
  const pwfile = path.join(root, ".data", ".pw");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(pwfile, password);
  run(initdb, ["-D", dataDir, `-U${user}`, "-A", "password", `--pwfile=${pwfile}`, "-E", "UTF8"]);
  fs.rmSync(pwfile, { force: true });
  console.log("PostgreSQL data directory initialised.");
}

clearStalePidFiles();
fs.mkdirSync(path.join(root, ".data"), { recursive: true });

run(pgCtl, ["-D", dataDir, "-l", logfile, "-o", `-p ${port}`, "start"]);

if (!(await waitForPort())) {
  console.error(`PostgreSQL did not become ready on port ${port} — check .data/pg.log`);
  process.exit(1);
}
console.log(`PostgreSQL started on port ${port}`);

const env = { ...process.env, PGPASSWORD: password };
try {
  execFileSync(createdb, ["-h", host, "-p", String(port), "-U", user, database], { stdio: "ignore", env });
  console.log(`Database "${database}" created.`);
} catch {
  // already exists
}

void crypto;
