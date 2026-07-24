import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "MEMBER" | "LEAD" | "ADMIN";
      departmentId: string | null;
    } & DefaultSession["user"];
    /**
     * Live Microsoft Graph access token for the signed-in user, server-only.
     * Never render this into a Client Component or expose it via useSession().
     */
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "MEMBER" | "LEAD" | "ADMIN";
    departmentId?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
