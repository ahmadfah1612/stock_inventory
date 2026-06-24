import "server-only";
import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/auth";

export type UserRow = { id: string; email: string; name: string; role: Role; createdAt: Date };

export async function listUsers(): Promise<UserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.email));
  return rows as UserRow[];
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  await db.insert(users).values({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    role: input.role,
    passwordHash,
  });
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function changePassword(id: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}
