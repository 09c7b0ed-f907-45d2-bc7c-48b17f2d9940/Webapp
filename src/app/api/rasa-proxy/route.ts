import { NextRequest, NextResponse } from "next/server";
import { getUserAccessToken } from "@/lib/userTokenVault";

const FETCH_TIMEOUT_MS = Number(process.env.RASA_PROXY_TIMEOUT_MS ?? 60000);
const ACTION_SERVER_TOKEN = process.env.ACTION_SERVER_TOKEN;

type ProxyRequestBody = {
  userSub: string;
  target: string;
  request: {
    path: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    body?: unknown;
  };
};

function getAllowedTargets(): Record<string, string> {
  const raw = process.env.RASA_PROXY_TARGETS;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const safe: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof key === "string" && typeof value === "string" && value.trim()) {
        safe[key.trim()] = value.trim();
      }
    }
    return safe;
  } catch {
    return {};
  }
}

function joinTargetUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${normalizedPath}`);

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (!key) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function POST(req: NextRequest) {
  if (!ACTION_SERVER_TOKEN) {
    console.error("[rasa-proxy] Missing ACTION_SERVER_TOKEN environment variable");
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  const serviceToken = req.headers.get("x-action-server-token");
  if (!serviceToken || serviceToken !== ACTION_SERVER_TOKEN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: ProxyRequestBody;
  try {
    body = (await req.json()) as ProxyRequestBody;
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  const userSub = body?.userSub?.trim();
  const target = body?.target?.trim();
  const request = body?.request;
  if (!userSub || !target || !request?.path) {
    return new NextResponse("Invalid proxy request", { status: 400 });
  }

  const userAccessToken = getUserAccessToken(userSub);
  if (!userAccessToken) {
    return new NextResponse("User token unavailable", { status: 401 });
  }

  const targets = getAllowedTargets();
  const baseUrl = targets[target];
  if (!baseUrl) {
    return new NextResponse("Unknown proxy target", { status: 403 });
  }

  const method = (request.method ?? "POST").toUpperCase();
  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  if (!allowedMethods.has(method)) {
    return new NextResponse("Unsupported HTTP method", { status: 400 });
  }

  const url = joinTargetUrl(baseUrl, request.path, request.query);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const outgoingHeaders: HeadersInit = {
    Authorization: `Bearer ${userAccessToken}`,
    "Content-Type": "application/json",
  };

  if (request.headers && typeof request.headers === "object") {
    for (const [key, value] of Object.entries(request.headers)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "authorization" || normalizedKey === "cookie") continue;
      outgoingHeaders[key] = value;
    }
  }

  const hasBody = method !== "GET" && method !== "DELETE";
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: outgoingHeaders,
      body: hasBody ? JSON.stringify(request.body ?? {}) : undefined,
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

  const responseText = await res.text();
  return new NextResponse(responseText, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
