import { NextRequest, NextResponse } from "next/server";
import { publishToSender } from "@/lib/sseBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTION_SERVER_TOKEN = process.env.ACTION_SERVER_TOKEN;

export async function POST(req: NextRequest) {
  if (!ACTION_SERVER_TOKEN) {
    console.error("[long-task-callback] Missing ACTION_SERVER_TOKEN environment variable");
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  const token = req.headers.get("x-action-server-token");
  if (token !== ACTION_SERVER_TOKEN) {
    console.warn("[long-task-callback] Unauthorized request: invalid token");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn("[long-task-callback] Invalid JSON body");
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  if (!body || typeof body !== "object" || !("senderId" in body) || !("messages" in body)) {
    console.warn("[long-task-callback] Missing senderId or messages");
    return new NextResponse("Missing senderId or messages", { status: 400 });
  }

  const { senderId, messages } = body as {
    senderId: string;
    messages: Array<Record<string, unknown>>;
  };

  if (!senderId || !Array.isArray(messages) || messages.length === 0) {
    console.warn("[long-task-callback] Invalid senderId or empty messages", {
      senderId,
      messagesLength: Array.isArray(messages) ? messages.length : undefined,
    });
    return new NextResponse("Invalid senderId or messages", { status: 400 });
  }

  for (const msg of messages) {
    // Push each message as a separate SSE event to this sender.
    publishToSender(senderId, {
      type: "long-task-result",
      senderId,
      ...msg,
    });
  }

  return NextResponse.json({ ok: true, senderId, messages: messages.length });
}
