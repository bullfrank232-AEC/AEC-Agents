import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "MEMBER" | "LEAD" | "ADMIN";
      departmentId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "MEMBER" | "LEAD" | "ADMIN";
    departmentId?: string | null;
  }
}
