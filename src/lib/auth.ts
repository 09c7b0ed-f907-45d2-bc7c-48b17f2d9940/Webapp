import KeycloakProvider from "next-auth/providers/keycloak";
import type { AuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 60 * 60 * 1000;
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() >= token.accessTokenExpires
      ) {
        if (token.refreshToken) {
          try {
            const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
            const params = new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            });

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            });

            const refreshedTokens = await response.json();

            if (!response.ok) throw refreshedTokens;

            token.accessToken = refreshedTokens.access_token;
            token.accessTokenExpires = Date.now() + refreshedTokens.expires_in * 1000;
            token.refreshToken = refreshedTokens.refresh_token ?? token.refreshToken;
            return token;
          } catch (error) {
            token.error = "RefreshAccessTokenError";
            return token;
          }
        } else {
          token.error = "RefreshAccessTokenError";
          return token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      session.accessTokenExpires = typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : undefined;
      if (token.error) session.error = token.error as string;
      return session;
    },
  },
};
