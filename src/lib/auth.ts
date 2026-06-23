import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: string } & import("next-auth").DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

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
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
