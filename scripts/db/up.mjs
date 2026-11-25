import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data", "pg");
const port = Number(process.env.PGPORT ?? 54329);
const pidFile = path.join(process.cwd(), ".data", "pg.pid");

if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, "utf8").trim();
  try {
    process.kill(Number(pid), 0);
    console.log(`PostgreSQL already running (pid ${pid}) on port ${port}`);
    process.exit(0);
  } catch {}
}

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
fs.mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
fs.writeFileSync(pidFile, String(process.pid));
console.log(`PostgreSQL ready on port ${port} (data: .data/pg)`);
setInterval(() => {}, 1 << 30);
