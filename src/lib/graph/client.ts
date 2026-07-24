import type { JWT } from "next-auth/jwt";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Refreshes a Microsoft Entra ID access token using the stored refresh token.
 * Called from the NextAuth `jwt` callback so the session always carries a
 * live Graph access token without the user having to sign in again.
 */
export async function refreshAzureAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) return token;

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AZURE_AD_CLIENT_ID!,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
      }
    );

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
    };
  } catch (error) {
    console.error("Failed to refresh Azure AD access token:", error);
    return { ...token, accessToken: undefined };
  }
}

/**
 * Server-only helper to get a live Graph access token for the signed-in user.
 * Returns null if Azure AD isn't configured or the user hasn't signed in
 * with Microsoft (e.g. using the local-dev credentials fallback).
 */
export async function getGraphAccessToken(): Promise<string | null> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  return session?.accessToken ?? null;
}

export async function graphFetch(path: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API ${path} failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
