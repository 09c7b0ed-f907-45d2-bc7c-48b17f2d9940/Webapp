// Mints a webapp session token for automated tooling (CVaLab) without a browser.
//
// Why this exists: CVaLab drives the real webapp/Rasa/Action stack over HTTP and needs
// a session cookie to do so. A pasted browser cookie goes stale in minutes because the
// underlying Keycloak access token isn't stored in the cookie at all -- it lives
// server-side in the Redis token vault (src/lib/userTokenVault.ts), looked up by the
// user's Keycloak `sub`. This script reuses webapp's own encode()/putUserTokens()
// functions (not a reimplementation) to do exactly what a real sign-in does: exchange
// credentials for Keycloak tokens, seed the vault, and issue a matching session cookie.
//
// Usage (from the host, so the redirect lands in CVaLab's own tmp dir).
// Note the --silent flag: without it, `pnpm run` prints a "> workspace@... $ tsx ..."
// banner to stdout ahead of the token, which corrupts the redirected cookie file.
//   docker exec -e CVALAB_KEYCLOAK_USERNAME=<user> -e CVALAB_KEYCLOAK_PASSWORD=<pass> \
//     webapp pnpm --silent mint-cvalab-session > ../CVaLab/tmp/webapp_cookie.txt
//
// Only the two CVALAB_KEYCLOAK_* credentials need to be supplied at invocation time --
// everything else (KEYCLOAK_ISSUER, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET,
// NEXTAUTH_SECRET, USER_TOKEN_VAULT_*) is already present in the running webapp
// container's environment, since it's the same config webapp's own auth uses.
//
// Prints only the raw session token to stdout; everything else goes to stderr, so
// output can be redirected straight into CVaLab's cookie file.

import { encode } from "next-auth/jwt";
import { putUserTokens } from "../src/lib/userTokenVault";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const segments = jwt.split(".");
  if (segments.length < 2) {
    throw new Error("id_token does not look like a JWT");
  }
  const json = Buffer.from(segments[1], "base64url").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const username = requireEnv("CVALAB_KEYCLOAK_USERNAME");
  const password = requireEnv("CVALAB_KEYCLOAK_PASSWORD");
  const issuer = requireEnv("KEYCLOAK_ISSUER").replace(/\/+$/, "");
  const clientId = requireEnv("KEYCLOAK_CLIENT_ID");
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim() || "";
  const nextAuthSecret = requireEnv("NEXTAUTH_SECRET");

  const tokenUrl = `${issuer}/protocol/openid-connect/token`;
  const form = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
    // The "openid" scope is what makes Keycloak include id_token in the
    // response -- without it you get a plain OAuth2 access token and nothing
    // to read `sub`/email/name from.
    scope: "openid profile email",
  });
  if (clientSecret) {
    form.set("client_secret", clientSecret);
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.error(`Keycloak token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    console.error(JSON.stringify(tokenPayload));
    process.exit(1);
  }

  const accessToken = tokenPayload.access_token as string;
  const refreshToken = (tokenPayload.refresh_token as string | undefined) ?? null;
  const idToken = tokenPayload.id_token as string | undefined;
  const expiresIn = Number(tokenPayload.expires_in ?? 0);
  if (!accessToken || !idToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    console.error("Keycloak response missing access_token/id_token/expires_in. Response keys:", Object.keys(tokenPayload));
    console.error(JSON.stringify(tokenPayload));
    process.exit(1);
  }

  const idClaims = decodeJwtPayload(idToken);
  const sub = typeof idClaims.sub === "string" ? idClaims.sub.trim() : "";
  const email = typeof idClaims.email === "string" ? idClaims.email : undefined;
  const name = typeof idClaims.name === "string" ? idClaims.name : undefined;
  if (!sub) {
    console.error("id_token is missing a sub claim");
    process.exit(1);
  }

  const accessTokenExpires = Date.now() + expiresIn * 1000;

  await putUserTokens({
    sub,
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessTokenExpires,
  });

  const sessionToken = await encode({
    token: { sub, email, name, accessTokenExpires },
    secret: nextAuthSecret,
    salt: "authjs.session-token",
  });

  process.stdout.write(`${sessionToken}\n`);
  console.error(`Minted session for sub=${sub} (email=${email ?? "unknown"}), access token expires in ${expiresIn}s.`);

  process.exit(0);
}

main().catch((error) => {
  console.error("mint-cvalab-session failed:", error);
  process.exit(1);
});
