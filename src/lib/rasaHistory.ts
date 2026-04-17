import { getRasaUrlForRequest } from "@/lib/rasaConfig";
import { buildRasaSenderId } from "@/lib/rasaSender";

type RasaHistoryEvent = {
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

export type RasaHistoryItem = {
  role: "user" | "assistant";
  text?: string;
  custom?: Record<string, unknown>;
  feedbackKey?: string;
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

export async function fetchRasaHistory(params: {
  headers: Headers;
  cookies: Map<string, string>;
  userSub: string;
  threadId: number | null;
  includeDebugMetadata?: boolean;
}) {
  const apiUrl = getRasaUrlForRequest(params.headers, params.cookies);
  if (!apiUrl) {
    return {
      history: [] as RasaHistoryItem[],
      error: "Rasa not configured",
      status: 500,
    };
  }

  const senderId = buildRasaSenderId(params.userSub, params.threadId);
  const tracker = await fetch(`${apiUrl}/conversations/${senderId}/tracker`, {
    cache: "no-store",
  });
  const contentType = tracker.headers.get("content-type") || "";

  if (!tracker.ok) {
    return {
      history: [] as RasaHistoryItem[],
      error: "Rasa tracker endpoint is unavailable",
      status: tracker.status,
    };
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      history: [] as RasaHistoryItem[],
      error: "Rasa tracker returned non-JSON response",
      status: tracker.status,
    };
  }

  let data: { events?: unknown };
  try {
    data = await tracker.json();
  } catch {
    return {
      history: [] as RasaHistoryItem[],
      error: "Failed to parse Rasa tracker response",
      status: tracker.status,
    };
  }

  const events = Array.isArray(data.events) ? (data.events as RasaHistoryEvent[]) : [];
  let turnIndex = 0;

  const history = events.flatMap((event, eventIndex): RasaHistoryItem[] => {
    const previousActionName =
      eventIndex > 0 && events[eventIndex - 1]?.event === "action"
        ? events[eventIndex - 1]?.name
        : undefined;

    if (event.event === "user") {
      const text = typeof event.text === "string" ? event.text : event.parse_data?.text;
      if (!text) return [];
      turnIndex += 1;

      return [
        {
          role: "user",
          text,
          ...(params.includeDebugMetadata
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
        },
      ];
    }

    if (event.event !== "bot") {
      return [];
    }

    const custom =
      event.custom && typeof event.custom === "object"
        ? event.custom
        : event.data?.custom && typeof event.data.custom === "object"
          ? event.data.custom
          : null;

    const debug = params.includeDebugMetadata
      ? {
          eventIndex,
          turnIndex,
          timestamp: event.timestamp,
          source: typeof event.metadata?.source === "string" ? event.metadata.source : undefined,
          actionName: previousActionName,
          policyName: event.policy,
          policyConfidence: event.confidence,
        }
      : undefined;

    if (typeof event.text === "string" && custom) {
      return [
        {
          role: "assistant",
          text: event.text,
          custom,
          feedbackKey: `bot:${eventIndex}`,
          ...(debug ? { debug } : {}),
        },
      ];
    }

    if (typeof event.text === "string") {
      return [
        {
          role: "assistant",
          text: event.text,
          feedbackKey: `bot:${eventIndex}`,
          ...(debug ? { debug } : {}),
        },
      ];
    }

    if (!custom) {
      return [];
    }

    return [
      {
        role: "assistant",
        custom,
        ...(debug ? { debug } : {}),
      },
    ];
  });

  return {
    history,
    error: undefined,
    status: tracker.status,
  };
}