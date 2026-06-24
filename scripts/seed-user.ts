import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  const [email, password, name, role] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: pnpm seed <email> <password> [name] [admin|user]");
    process.exit(1);
  }
  const r = role === "admin" ? "admin" : "user";
  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, passwordHash: hash, name: name ?? "Staff", role: r });
  console.log(`Created ${r} user`, email);
  process.exit(0);
}

main();
