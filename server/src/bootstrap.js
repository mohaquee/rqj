/**
 * Bootstrap: run this ONCE on a fresh database to:
 *   1. Apply schema (tables + indexes + triggers)
 *   2. Seed the 14 employees
 *   3. Create 10 user accounts with bcrypt-hashed passwords
 *
 * Usage:
 *   cd server
 *   cp .env.example .env  # edit DATABASE_URL and JWT_SECRET first!
 *   npm install
 *   node src/bootstrap.js
 *
 * After bootstrap, the firm administrator should change passwords via
 * a separate admin tool — these defaults are for first-run only.
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { pool, query, withTransaction } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_DIR = path.resolve(__dirname, "..", "sql");

// ─── Default users — passwords get bcrypt-hashed before insertion ──────
const DEFAULT_USERS = [
  { username: "director",  password: "rq2026",       employeeId: "e1",  role: "director", displayName: "Ruhul Quddus Kazal",   displayRole: "Director" },
  { username: "ar.murad",  password: "murad2026",    employeeId: "e2",  role: "employee", displayName: "Akter Rasul Murad",    displayRole: "Senior Associate" },
  { username: "m.billah",  password: "billah2026",   employeeId: "e3",  role: "employee", displayName: "Md. Mosaddek Billah",  displayRole: "Senior Associate" },
  { username: "a.hossain", password: "hossain2026",  employeeId: "e4",  role: "employee", displayName: "Md. Anwar Hossain",    displayRole: "Associate" },
  { username: "s.tuhin",   password: "tuhin2026",    employeeId: "e5",  role: "employee", displayName: "Md. Salahuddin",       displayRole: "Associate" },
  { username: "s.islam",   password: "islam2026",    employeeId: "e6",  role: "employee", displayName: "Syful Islam",          displayRole: "Associate" },
  { username: "d.chapa",   password: "chapa2026",    employeeId: "e7",  role: "employee", displayName: "Dulon Chapa",          displayRole: "Associate" },
  { username: "i.monika",  password: "monika2026",   employeeId: "e8",  role: "employee", displayName: "Israt Jahan Monika",   displayRole: "Associate" },
  { username: "h.rahman",  password: "rahman2026",   employeeId: "e9",  role: "employee", displayName: "Habibur Rahman",       displayRole: "Associate" },
  { username: "m.islam",   password: "research2026", employeeId: "e10", role: "employee", displayName: "Md. Muzahidul Islam",  displayRole: "Research Associate" },
];

async function runSqlFile(filename) {
  const fullPath = path.join(SQL_DIR, filename);
  const sql = fs.readFileSync(fullPath, "utf8");
  console.log(`  Running ${filename}...`);
  await query(sql);
}

async function main() {
  console.log("\n═══ RQJ Bootstrap ═══\n");

  console.log("[1] Applying schema...");
  await runSqlFile("01_schema.sql");

  console.log("\n[2] Seeding employees...");
  await runSqlFile("02_seed_employees.sql");
  const empCount = await query(`SELECT COUNT(*)::int AS c FROM employees`);
  console.log(`    ${empCount.rows[0].c} employees in database`);

  console.log("\n[3] Creating user accounts (bcrypt hashing)...");
  await withTransaction(async (client) => {
    for (const u of DEFAULT_USERS) {
      const existing = await client.query(`SELECT id FROM users WHERE username = $1`, [u.username]);
      if (existing.rowCount > 0) {
        console.log(`    ⏭  ${u.username} already exists, skipping`);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (username, password_hash, employee_id, role, display_name, display_role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.username, hash, u.employeeId, u.role, u.displayName, u.displayRole]
      );
      console.log(`    ✓  ${u.username.padEnd(12)} (${u.role.padEnd(8)}) → ${u.displayName}`);
    }
  });

  const userCount = await query(`SELECT COUNT(*)::int AS c FROM users`);
  console.log(`\n    ${userCount.rows[0].c} users in database`);

  console.log("\n✅ Bootstrap complete. The API is ready to start with: npm start\n");
  console.log("⚠️  IMPORTANT: All accounts use default passwords from the bootstrap script.");
  console.log("    Change them in production by running an UPDATE on the users table");
  console.log("    with bcrypt-hashed values, or build an admin password-reset endpoint.\n");

  await pool.end();
}

main().catch(err => {
  console.error("Bootstrap failed:", err);
  pool.end();
  process.exit(1);
});
