import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: pnpm seed <email> <password> [name]");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, passwordHash: hash, name: name ?? "Staff" });
  console.log("Created user", email);
  process.exit(0);
}

main();
