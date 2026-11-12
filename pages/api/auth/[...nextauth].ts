import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import {
  canOpenGalleryByLink,
  isAccessLocked,
  isValidAccessCodeFormat,
  isValidShareSlug,
  nextFailedAccessState,
  normalizeAccessCode,
} from "../../../lib/galleryAccess";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.active) return null;
        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // Clients open a shared gallery with its link + 6-digit code — no account password needed.
    // A successful code signs them in as the gallery's client, so all existing access rules apply.
    CredentialsProvider({
      id: "gallery",
      name: "Gallery code",
      credentials: {
        slug: { label: "Gallery", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const slug = credentials?.slug;
        const code = normalizeAccessCode(credentials?.code);
        if (!isValidShareSlug(slug) || !isValidAccessCodeFormat(code)) return null;

        const project = await prisma.clientProject.findUnique({
          where: { shareSlug: slug },
          include: { client: true },
        });
        if (!project || !project.accessCodeHash || !canOpenGalleryByLink(project.status)) return null;
        if (project.client.role !== "CLIENT" || !project.client.active) return null;
        if (isAccessLocked(project.accessLockedUntil)) return null;

        const isValid = await compare(code, project.accessCodeHash);
        if (!isValid) {
          const next = nextFailedAccessState(project.accessFailedAttempts);
          await prisma.clientProject.update({
            where: { id: project.id },
            data: { accessFailedAttempts: next.attempts, accessLockedUntil: next.lockedUntil },
          });
          return null;
        }

        if (project.accessFailedAttempts > 0 || project.accessLockedUntil) {
          await prisma.clientProject.update({
            where: { id: project.id },
            data: { accessFailedAttempts: 0, accessLockedUntil: null },
          });
        }

        return {
          id: project.client.id,
          email: project.client.email,
          name: project.client.name,
          role: project.client.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.uid;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
