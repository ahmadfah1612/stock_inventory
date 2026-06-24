// Runtime migration runner for the standalone production image.
// Uses drizzle-orm's migrator (no drizzle-kit needed) against ./drizzle.
// Optionally bootstraps a first admin from ADMIN_EMAIL / ADMIN_PASSWORD
// when the users table is empty.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("migrations applied");

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const { rows } = await pool.query("select count(*)::int as n from users");
  if (rows[0].n === 0) {
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      "insert into users (email, password_hash, name, role) values ($1, $2, $3, 'admin')",
      [ADMIN_EMAIL, hash, "Admin"],
    );
    console.log("seeded admin:", ADMIN_EMAIL);
  }
}

await pool.end();
