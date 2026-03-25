import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";
import { putUserAccessToken } from "@/lib/userTokenVault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken || !token?.sub) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const senderId = String(token.sub);
  putUserAccessToken({
    sub: senderId,
    accessToken: String(token.accessToken),
    accessTokenExpiresAt:
      typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : undefined,
  });

  const { message } = await req.json();

  const baseCallback = process.env.CALLBACK_BASE_URL;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const callbackUrl = baseCallback
    ? `${baseCallback.replace(/\/$/, "")}/api/rasa/long-task-callback`
    : host
      ? `${proto}://${host}/api/rasa/long-task-callback`
      : null;

  const apiUrl = getRasaUrlForRequest(req.headers, new Map(req.cookies.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }

  const controller = new AbortController();
  const clientSignal: AbortSignal | undefined = (req as unknown as { signal?: AbortSignal }).signal;
  if (clientSignal) {
    const onAbort = () => controller.abort();
    clientSignal.addEventListener("abort", onAbort, { once: true });
  }

  const rasaStreamRes = await fetch(`${apiUrl}/webhooks/rest/webhook?stream=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: senderId,
      message,
      ...(callbackUrl
        ? {
            metadata: {
              callback_url: callbackUrl,
            },
          }
        : {}),
    }),
    signal: controller.signal,
  });

  return new Response(rasaStreamRes.body, {
    status: rasaStreamRes.status,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
