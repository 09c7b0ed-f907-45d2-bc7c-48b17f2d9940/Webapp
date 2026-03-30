import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";
import { putUserAccessToken } from "@/lib/userTokenVault";
import { buildRasaSenderId } from "@/lib/rasaSender";
import { touchThreadForUser } from "@/lib/threadRegistryStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken || !token?.sub) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userSub = String(token.sub);
  const body = await req.json();
  const message = typeof body?.message === "string" ? body.message : "";
  const rawThreadId = body?.threadId;
  const threadId = typeof rawThreadId === "number" && Number.isFinite(rawThreadId) ? rawThreadId : null;
  const senderId = buildRasaSenderId(userSub, threadId);

  if (typeof threadId === "number") {
    await touchThreadForUser(userSub, threadId);
  }

  const tokenPayload = {
    accessToken: String(token.accessToken),
    accessTokenExpiresAt:
      typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : undefined,
  };

  putUserAccessToken({
    sub: userSub,
    ...tokenPayload,
  });

  if (senderId !== userSub) {
    putUserAccessToken({
      sub: senderId,
      ...tokenPayload,
    });
  }

  const apiUrl = getRasaUrlForRequest(req.headers, new Map(req.cookies.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }

  const baseCallback = process.env.CALLBACK_BASE_URL;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const callbackBase = baseCallback
    ? `${baseCallback.replace(/\/$/, "")}/api/rasa/long-task-callback`
    : host
      ? `${proto}://${host}/api/rasa/long-task-callback`
      : null;
  const callbackUrl = callbackBase
    ? `${callbackBase}?rasaUrl=${encodeURIComponent(apiUrl)}&senderId=${encodeURIComponent(senderId)}`
    : null;

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
