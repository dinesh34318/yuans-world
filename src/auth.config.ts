import type { NextAuthConfig } from "next-auth";

// This config is shared between the full auth setup and the middleware.
// It does NOT import Prisma or any Node.js-only modules, so it's safe for Edge Runtime.

declare module "next-auth" {
  interface User {
    role: string;
    childProfileId?: string;
    childName?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      role: string;
      childProfileId?: string;
      childName?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    childProfileId?: string;
    childName?: string;
  }
}

export const authConfig = {
  providers: [], // Empty for middleware - full providers added in auth.ts
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login/parent",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        if (user.childProfileId) {
          token.childProfileId = user.childProfileId;
        }
        if (user.childName) {
          token.childName = user.childName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.childProfileId) {
          session.user.childProfileId = token.childProfileId;
        }
        if (token.childName) {
          session.user.childName = token.childName;
        }
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
