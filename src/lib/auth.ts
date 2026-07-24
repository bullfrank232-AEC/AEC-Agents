import NextAuth from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Provider } from "next-auth/providers";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isAzureAdConfigured } from "@/lib/graph/config";

// Dev-only stand-in for real sign-in until Azure AD is configured (see SETUP.md).
// Enabled by default only when Azure AD is NOT configured; can be force-enabled
// alongside Azure AD with ALLOW_LOCAL_LOGIN=true for testing.
const localLoginEnabled =
  process.env.ALLOW_LOCAL_LOGIN === "true" || !isAzureAdConfigured();

const providers: Provider[] = [];

if (isAzureAdConfigured()) {
  providers.push(
    // Default scopes only (openid/profile/email/User.Read) — no extra Graph
    // permissions requested, so this never needs tenant admin consent.
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    })
  );
}

if (localLoginEnabled) {
  providers.push(
    Credentials({
      id: "local-dev",
      name: "Local development login",
      credentials: {
        userId: { label: "User", type: "text" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId;
        if (typeof userId !== "string" || !userId) return null;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin" },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            azureAdId: account?.provider === "microsoft-entra-id" ? account.providerAccountId : undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? user.email,
            azureAdId: account?.provider === "microsoft-entra-id" ? account.providerAccountId : undefined,
          },
        });
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.departmentId = dbUser.departmentId;
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.departmentId = token.departmentId ?? null;
      return session;
    },
  },
});

export { localLoginEnabled };
