// Phase 2 of the cross-service auth redesign: verifies bearer tokens via
// Keycloak's introspection endpoint (RFC 7662). Used both for Action's own
// service-account identity (see verifyActionServiceBearer below) --
// separate from Rasa's own introspection, which lives in Rasa's codebase
// since Rasa is the one verifying the *user's* token, not Webapp.
//
// Introspection only requires the caller to authenticate as *a* valid
// confidential client -- it doesn't need to be the client that issued the
// token being introspected, so this reuses Webapp's own existing
// KEYCLOAK_CLIENT_ID/_SECRET rather than requiring a separate credential.

export async function introspectToken(token: string): Promise<Record<string, unknown> | null> {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret || !token) {
    return null;
  }

  const url = `${issuer.replace(/\/$/, "")}/protocol/openid-connect/token/introspect`;
  const params = new URLSearchParams({ token, client_id: clientId, client_secret: clientSecret });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as Record<string, unknown>;
    return payload?.active === true ? payload : null;
  } catch {
    return null;
  }
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

// Verifies a bearer token belongs to Action's own Keycloak service-account
// client (client_credentials grant, not a real user) -- this is what
// replaces "only Action holds ACTION_SERVER_TOKEN" as the guarantee that
// the caller really is the Action service. Returns false (never throws) if
// ACTION_SERVICE_CLIENT_ID isn't configured yet -- callers should fall back
// to the legacy static-token check in that case, not treat this as a pass.
export async function verifyActionServiceBearer(authHeader: string | null): Promise<boolean> {
  const expectedClientId = process.env.ACTION_SERVICE_CLIENT_ID?.trim();
  if (!expectedClientId) return false;

  const token = extractBearerToken(authHeader);
  if (!token) return false;

  const payload = await introspectToken(token);
  if (!payload) return false;

  const azp = typeof payload.azp === "string" ? payload.azp : null;
  const clientId = typeof payload.client_id === "string" ? payload.client_id : null;
  return (azp ?? clientId) === expectedClientId;
}
