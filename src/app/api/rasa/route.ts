import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { message } = await req.json();

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
    body: JSON.stringify({ sender: token.accessToken, message }),
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
