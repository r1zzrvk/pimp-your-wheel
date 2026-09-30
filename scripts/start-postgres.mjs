import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

const docker = spawnSync("docker", ["compose", "up", "-d"], {
  stdio: "inherit",
});

if (!docker.error && docker.status === 0) {
  process.exit(0);
}

const databaseDir = ".data/pg";
const postgres = new EmbeddedPostgres({
  databaseDir,
  user: "roulette",
  password: "roulette",
  port: 5432,
  persistent: true,
  // Windows initdb otherwise uses the ANSI code page (WIN1251 on this machine).
  // That encoding cannot store the emoji used for avatars and achievements.
  initdbFlags: ["--locale=C", "--encoding=UTF8"],
});

if (!existsSync(`${databaseDir}/PG_VERSION`)) {
  await postgres.initialise();
}

await postgres.start();

try {
  await postgres.createDatabase("roulette");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

console.log("Postgres is listening on localhost:5432");
await new Promise(() => {});
