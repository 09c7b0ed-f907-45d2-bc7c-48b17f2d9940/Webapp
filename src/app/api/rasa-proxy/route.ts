import { jwtVerify, createRemoteJWKSet } from "jose";
import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = Number(process.env.RASA_PROXY_TIMEOUT_MS ?? 60000);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!rawToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const issuer = process.env.KEYCLOAK_ISSUER;
  if (!issuer) {
    console.error("Missing KEYCLOAK_ISSUER environment variable");
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  const JWKS = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));

  try {
    await jwtVerify(rawToken, JWKS);
  } catch (err) {
    console.error("Invalid JWT:", err);
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { operation, target, url, payload: gqlPayload } = await req.json();

  if (operation !== "query" || target !== "graphql" || !url || !gqlPayload?.query) {
    return new NextResponse("Invalid proxy request", { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rawToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: gqlPayload.query,
        variables: gqlPayload.variables ?? {},
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === "AbortError") {
      console.error("GraphQL fetch timed out after", FETCH_TIMEOUT_MS, "ms");
      return new NextResponse("Upstream timeout", { status: 504 });
    }

    console.error("GraphQL fetch failed:", err);
    return new NextResponse("Upstream request failed", { status: 502 });
  }

  clearTimeout(timeoutId);

  const data = await res.json();

  return res.ok
    ? NextResponse.json(data)
    : new NextResponse("GraphQL error", { status: res.status });
}
