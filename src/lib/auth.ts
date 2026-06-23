import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (c) => {
        const email = String(c?.email ?? "");
        const password = String(c?.password ?? "");
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        if (!(await bcrypt.compare(password, u.passwordHash))) return null;
        return { id: u.id, email: u.email, name: u.name };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
