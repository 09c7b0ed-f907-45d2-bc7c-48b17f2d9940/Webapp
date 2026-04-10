import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";
import { buildRasaSenderId } from "@/lib/rasaSender";

const CHAT_DEBUG_MODE = process.env.NODE_ENV === "development";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = await getToken({ req });
  const userSub = token?.sub ? String(token.sub) : null;

  if (!userSub) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const threadParam = req.nextUrl.searchParams.get("threadId");
  const parsedThreadId = threadParam ? Number(threadParam) : NaN;
  const threadId = Number.isFinite(parsedThreadId) ? parsedThreadId : null;
  const senderId = buildRasaSenderId(userSub, threadId);

  const apiUrl = getRasaUrlForRequest(headerStore, new Map(cookieStore.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }
  const tracker = await fetch(`${apiUrl}/conversations/${senderId}/tracker`);
  const contentType = tracker.headers.get("content-type") || "";

  if (!tracker.ok) {
    return NextResponse.json(
      {
        history: [],
        error: "Rasa tracker endpoint is unavailable",
        status: tracker.status,
      },
      { status: 200 }
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      {
        history: [],
        error: "Rasa tracker returned non-JSON response",
        status: tracker.status,
      },
      { status: 200 }
    );
  }

  let data: { events?: unknown };
  try {
    data = await tracker.json();
  } catch {
    return NextResponse.json(
      {
        history: [],
        error: "Failed to parse Rasa tracker response",
        status: tracker.status,
      },
      { status: 200 }
    );
  }

  type Event = {
    event: string;
    text?: string;
    parse_data?: {
      text?: string;
      intent?: { name?: string; confidence?: number };
      entities?: unknown[];
    };
    custom?: Record<string, unknown>;
    data?: { custom?: Record<string, unknown> };
    timestamp?: number;
    metadata?: Record<string, unknown>;
    policy?: string;
    confidence?: number;
    name?: string;
  };

  type HistoryItem = {
    role: "user" | "assistant";
    text?: string;
    custom?: Record<string, unknown>;
    debug?: {
      eventIndex: number;
      turnIndex: number;
      timestamp?: number;
      source?: string;
      intentName?: string;
      intentConfidence?: number;
      entities?: unknown[];
      actionName?: string;
      policyName?: string;
      policyConfidence?: number;
    };
  };

  const events = Array.isArray(data.events) ? (data.events as Event[]) : [];
  let turnIndex = 0;

  const history: HistoryItem[] = events.flatMap((event, eventIndex): HistoryItem[] => {
      const previousActionName =
        eventIndex > 0 && events[eventIndex - 1]?.event === "action"
          ? events[eventIndex - 1]?.name
          : undefined;

      if (event.event === "user") {
        const text = typeof event.text === "string" ? event.text : event.parse_data?.text;
        if (!text) return [];
        turnIndex += 1;

        return [{
          role: "user",
          text,
          ...(CHAT_DEBUG_MODE
            ? {
                debug: {
                  eventIndex,
                  turnIndex,
                  timestamp: event.timestamp,
                  source: typeof event.metadata?.source === "string" ? event.metadata.source : undefined,
                  intentName: event.parse_data?.intent?.name,
                  intentConfidence: event.parse_data?.intent?.confidence,
                  entities: Array.isArray(event.parse_data?.entities) ? event.parse_data?.entities : undefined,
                },
              }
            : {}),
        }];
      }

      if (event.event === "bot") {
        const custom =
          event.custom && typeof event.custom === "object"
            ? event.custom
            : event.data?.custom && typeof event.data.custom === "object"
              ? event.data.custom
              : null;

        if (typeof event.text === "string" && custom) {
          return [{
            role: "assistant",
            text: event.text,
            custom,
            ...(CHAT_DEBUG_MODE
              ? {
                  debug: {
                    eventIndex,
                    turnIndex,
                    timestamp: event.timestamp,
                    source: typeof event.metadata?.source === "string" ? event.metadata.source : undefined,
                    actionName: previousActionName,
                    policyName: event.policy,
                    policyConfidence: event.confidence,
                  },
                }
              : {}),
          }];
        }

        if (typeof event.text === "string") {
          return [{
            role: "assistant",
            text: event.text,
            ...(CHAT_DEBUG_MODE
              ? {
                  debug: {
                    eventIndex,
                    turnIndex,
                    timestamp: event.timestamp,
                    source: typeof event.metadata?.source === "string" ? event.metadata.source : undefined,
                    actionName: previousActionName,
                    policyName: event.policy,
                    policyConfidence: event.confidence,
                  },
                }
              : {}),
          }];
        }

        if (custom) {
          return [{
            role: "assistant",
            custom,
            ...(CHAT_DEBUG_MODE
              ? {
                  debug: {
                    eventIndex,
                    turnIndex,
                    timestamp: event.timestamp,
                    source: typeof event.metadata?.source === "string" ? event.metadata.source : undefined,
                    actionName: previousActionName,
                    policyName: event.policy,
                    policyConfidence: event.confidence,
                  },
                }
              : {}),
          }];
        }
      }

      return [];
    });

  return NextResponse.json({ history });
}
