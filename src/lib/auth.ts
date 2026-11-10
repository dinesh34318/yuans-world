import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "parent-login",
      name: "Parent Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email);
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "PARENT",
        };
      },
    }),
    Credentials({
      id: "child-login",
      name: "Child Login",
      credentials: {
        childId: { label: "Child ID", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.childId || !credentials?.pin) return null;

        const childIdInput = String(credentials.childId);
        const pin = String(credentials.pin);

        const child = await prisma.child.findUnique({
          where: { childId: childIdInput },
          include: { parent: true },
        });

        if (!child) return null;

        const isValid = await bcrypt.compare(pin, child.pinHash);
        if (!isValid) return null;

        return {
          id: child.parentId,
          name: child.name,
          email: null,
          role: "CHILD",
          childProfileId: child.id,
          childName: child.name,
        };
      },
    }),
  ],
});
