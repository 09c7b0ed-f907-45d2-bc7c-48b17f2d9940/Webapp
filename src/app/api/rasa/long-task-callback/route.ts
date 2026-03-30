import { NextRequest, NextResponse } from "next/server";
import { publishToSender } from "@/lib/sseBus";
import { getRasaBots } from "@/lib/rasaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTION_SERVER_TOKEN = process.env.ACTION_SERVER_TOKEN;

type CallbackMessage = {
  text?: unknown;
  custom?: unknown;
};

function normalizeRasaUrl(input: string): string {
  return input.trim().replace(/\/$/, "");
}

function resolveRasaUrl(req: NextRequest, body: Record<string, unknown>): string | null {
  const fromQuery = req.nextUrl.searchParams.get("rasaUrl");
  const fromBody = typeof body.rasaUrl === "string" ? body.rasaUrl : null;
  const candidate = fromQuery ?? fromBody;
  if (!candidate) return null;

  const normalizedCandidate = normalizeRasaUrl(candidate);
  const allowed = getRasaBots().map((bot) => normalizeRasaUrl(bot.url));

  if (!allowed.includes(normalizedCandidate)) {
    return null;
  }

  return normalizedCandidate;
}

function toTrackerEvents(messages: CallbackMessage[]): Array<Record<string, unknown>> {
  const events: Array<Record<string, unknown>> = [];

  for (const message of messages) {
    if (!message || typeof message !== "object") continue;

    const text = typeof message.text === "string" ? message.text : null;
    const custom =
      message.custom && typeof message.custom === "object"
        ? (message.custom as Record<string, unknown>)
        : null;

    if (!text && !custom) continue;

    const event: Record<string, unknown> = {
      event: "bot",
      metadata: {
        source: "long-task-callback",
      },
    };

    if (text) {
      event.text = text;
    }

    if (custom) {
      event.data = { custom };
    }

    events.push(event);
  }

  return events;
}

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

  const payload = body as {
    senderId: string;
    messages: Array<Record<string, unknown>>;
  };
  const expectedSenderId = req.nextUrl.searchParams.get("senderId")?.trim() || null;
  const receivedSenderId = payload.senderId;
  const senderId = expectedSenderId || receivedSenderId;
  const { messages } = payload;

  if (!senderId || !Array.isArray(messages) || messages.length === 0) {
    console.warn("[long-task-callback] Invalid senderId or empty messages", {
      senderId: receivedSenderId,
      expectedSenderId,
      messagesLength: Array.isArray(messages) ? messages.length : undefined,
    });
    return new NextResponse("Invalid senderId or messages", { status: 400 });
  }

  if (expectedSenderId && receivedSenderId && expectedSenderId !== receivedSenderId) {
    console.warn("[long-task-callback] Sender mismatch; using expected sender from callback URL", {
      expectedSenderId,
      receivedSenderId,
    });
  }

  const rasaUrl = resolveRasaUrl(req, payload as unknown as Record<string, unknown>);
  if (!rasaUrl) {
    console.warn("[long-task-callback] Missing or invalid rasaUrl for callback persistence");
    return new NextResponse("Missing or invalid rasaUrl", { status: 400 });
  }

  const trackerEvents = toTrackerEvents(messages as CallbackMessage[]);
  const customCount = (messages as CallbackMessage[]).filter(
    (msg) => !!msg && typeof msg === "object" && !!msg.custom && typeof msg.custom === "object"
  ).length;
  console.info("[long-task-callback] Received callback payload", {
    senderId,
    messageCount: messages.length,
    trackerEventCount: trackerEvents.length,
    customCount,
  });
  if (trackerEvents.length > 0) {
    const trackerResponse = await fetch(
      `${rasaUrl}/conversations/${senderId}/tracker/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackerEvents),
      }
    );

    if (!trackerResponse.ok) {
      const errText = await trackerResponse.text();
      console.error("[long-task-callback] Failed to persist callback events to tracker", {
        status: trackerResponse.status,
        senderId,
        response: errText,
      });
      return new NextResponse("Failed to persist callback events", { status: 502 });
    }
  }

  for (const msg of messages) {
    publishToSender(senderId, msg);
  }

  return NextResponse.json({ ok: true, senderId, messages: messages.length });
}
