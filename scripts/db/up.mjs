import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, ".data", "pg");
const port = Number(process.env.PGPORT ?? 54329);
const host = "127.0.0.1";
const pidFile = path.join(root, ".data", "pg.pid");

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

function clearStalePidFiles() {
  const candidates = [
    pidFile,
    path.join(dataDir, "postmaster.pid"),
    path.join(dataDir, "postmaster.opts"),
  ];
  for (const file of candidates) {
    try {
      fs.rmSync(file, { force: true });
    } catch {}
  }
}

if (await probePort()) {
  console.log(`PostgreSQL already running on port ${port}`);
  process.exit(0);
}

clearStalePidFiles();

const initialised = fs.existsSync(path.join(dataDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "bugfa",
  password: "bugfa",
  port,
  persistent: true,
});

if (!initialised) {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("bugfa");
} catch (err) {
  if (!String(err).includes("already exists")) throw err;
}
fs.mkdirSync(path.join(root, ".data"), { recursive: true });
fs.writeFileSync(pidFile, String(process.pid));
console.log(`PostgreSQL ready on port ${port} (data: .data/pg)`);
setInterval(() => {}, 1 << 30);
