import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.SUPABASE_DB_URL;
const backupDir = process.env.BACKUP_DIR || "./backups";

if (!databaseUrl) {
  console.error("SUPABASE_DB_URL is required. Use Supabase's direct Postgres connection string.");
  process.exit(1);
}

await mkdir(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.resolve(backupDir, `xencheats-${stamp}.dump`);

const child = spawn("pg_dump", ["--format=custom", "--no-owner", "--file", file, databaseUrl], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.once("error", (error) => {
  console.error(`Could not start pg_dump: ${error.message}`);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  if (code === 0) console.log(`Backup written to ${file}`);
  else process.exitCode = code || 1;
});
