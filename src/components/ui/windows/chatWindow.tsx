"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import ChatMessageList from "@/components/ui/chat-message-list";
import { useChatStore } from "@/store/useChatStore";
import {
  isVisualizationPlanMessageDTO,
  isVisualizationResponseDTO,
  resolveVisualizationTraceId,
  type VisualizationPlanMessageDTO,
} from "@/models/dto/response";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { WaveAsset } from "../assets/wave-asset";
import { RobotIcon } from "../icons/robot-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useThread } from "@/components/ThreadContext";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
  kind?: "normal" | "progress" | "plan";
  feedbackKey?: string;
  feedback?: {
    submitted: boolean;
    rating: "up" | "down";
    issues?: string[];
    detailText?: string | null;
  } | null;
  debug?: {
    pending?: boolean;
    eventIndex?: number;
    turnIndex?: number;
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

type HistoryResponseItem = {
  role?: unknown;
  text?: unknown;
  custom?: unknown;
  feedbackKey?: unknown;
  feedback?: unknown;
  debug?: unknown;
};

type FeedbackPayload = {
  submitted: boolean;
  rating: "up" | "down";
  issues?: string[];
  detailText?: string | null;
};

type HistoryApiResponse = {
  history?: unknown;
  error?: string;
  status?: number;
};

const PLAN_CHAT_DEBUG_MODE = process.env.NODE_ENV === "development";

function formatPlanDebugMessage(plan: VisualizationPlanMessageDTO, traceId: string | null): string {
  const normalizedPlan: VisualizationPlanMessageDTO = {
    ...plan,
    ...(traceId && !plan.trace_id ? { trace_id: traceId } : {}),
  };

  let payload = "";
  try {
    payload = JSON.stringify(normalizedPlan, null, 2);
  } catch {
    payload = "{\n  \"error\": \"Failed to serialize visualization plan payload\"\n}";
  }

  return ["[dev] Visualization plan payload", payload].join("\n");
}

function mapHistoryItems(items: unknown[]): { mapped: Message[]; customPayloads: unknown[] } {
  const customPayloads: unknown[] = [];
  const mapped = items.flatMap((item): Message[] => {
    const candidate = item as HistoryResponseItem;
    if (!candidate || (candidate.role !== "user" && candidate.role !== "assistant")) return [];

    if (candidate.custom && typeof candidate.custom === "object") {
      customPayloads.push(candidate.custom);
    }

    if (typeof candidate.text !== "string") return [];

    return [{
      id: crypto.randomUUID(),
      sender: candidate.role === "user" ? "user" : "other",
      content: candidate.text,
      feedbackKey: typeof candidate.feedbackKey === "string" ? candidate.feedbackKey : undefined,
      feedback:
        candidate.feedback && typeof candidate.feedback === "object"
          ? (candidate.feedback as FeedbackPayload)
          : undefined,
      debug: candidate.debug && typeof candidate.debug === "object" ? candidate.debug as Message["debug"] : undefined,
    }];
  });

  return { mapped, customPayloads };
}

async function fetchThreadHistory(threadId: number): Promise<{
  mapped: Message[];
  customPayloads: unknown[];
  error: string | null;
  status: number | null;
}> {
  const res = await fetch(`/api/rasa/history?threadId=${threadId}`, {
    credentials: "include",
    cache: "no-store",
  });

  let data: HistoryApiResponse | null = null;
  try {
    data = (await res.json()) as HistoryApiResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    return {
      mapped: [],
      customPayloads: [],
      error: data?.error ?? `History request failed (${res.status})`,
      status: data?.status ?? res.status,
    };
  }

  const { mapped, customPayloads } = mapHistoryItems(Array.isArray(data?.history) ? data.history : []);

  return {
    mapped,
    customPayloads,
    error: typeof data?.error === "string" ? data.error : null,
    status: typeof data?.status === "number" ? data.status : res.status,
  };
}


export default function ChatWindow() {
  const { currentThreadId } = useThread();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWaitingForBot, setIsWaitingForBot] = useState(false);
  const hydrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenPlanMessageKeysRef = useRef<Set<string>>(new Set());
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation('common');

  const emitPlanDebugMessage = useCallback((plan: VisualizationPlanMessageDTO, traceId: string | null) => {
    if (!PLAN_CHAT_DEBUG_MODE) {
      return;
    }

    const planKey = traceId
      ? `trace:${traceId}`
      : (() => {
          try {
            return `plan:${JSON.stringify(plan.plan)}`;
          } catch {
            return null;
          }
        })();

    if (!planKey || seenPlanMessageKeysRef.current.has(planKey)) {
      return;
    }

    seenPlanMessageKeysRef.current.add(planKey);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "other",
        kind: "plan",
        content: formatPlanDebugMessage(plan, traceId),
        debug: {
          source: "visualization-plan",
        },
      },
    ]);
  }, []);

  const applyVisualizationFromCustom = useCallback((custom: unknown) => {
    const { setVisualization, addToHistory, setSelectedChartIndex, rememberVisualizationPlan } = useChatStore.getState();

    if (isVisualizationPlanMessageDTO(custom)) {
      const traceId = resolveVisualizationTraceId(custom);
      if (traceId) {
        rememberVisualizationPlan(traceId, custom);
      }
      emitPlanDebugMessage(custom, traceId);
      return;
    }

    if (isVisualizationResponseDTO(custom)) {
      setVisualization(custom);
      addToHistory(custom);
      setSelectedChartIndex(0);
    }
  }, []);

  const hydrateFromHistory = useCallback(async () => {
    if (!currentThreadId) return;

    try {
      const { mapped, customPayloads, error, status } = await fetchThreadHistory(currentThreadId);

      if (error && status !== 404) {
        console.warn("Silent tracker hydration degraded:", error);
      }

      setMessages((prev) => {
        const carryOver = prev.filter((m) => m.kind === "progress" || m.kind === "plan");
        return carryOver.length > 0 ? [...mapped, ...carryOver] : mapped;
      });
      for (const customPayload of customPayloads) {
        applyVisualizationFromCustom(customPayload);
      }
    } catch (err) {
      console.error("Silent tracker hydration failed:", err);
    }
  }, [applyVisualizationFromCustom, currentThreadId]);

  const scheduleHydration = useCallback(() => {
    if (hydrationTimerRef.current) {
      clearTimeout(hydrationTimerRef.current);
    }

    hydrationTimerRef.current = setTimeout(() => {
      hydrateFromHistory().catch((err) => {
        console.error("Failed to hydrate tracker metadata:", err);
      });
    }, 900);
  }, [hydrateFromHistory]);

  const handleCustomPayload = useCallback((custom: unknown) => {
    const obj = custom as { progress?: unknown } | null;
    const progressText =
      obj && typeof obj === "object" && typeof obj.progress === "string"
        ? (obj.progress as string)
        : null;

    if (progressText) {
      setIsWaitingForBot(true);
      // Show or update a single temporary progress bubble.
      setMessages((prev) => {
        const base = prev.filter((m) => m.kind !== "progress");
        return [
          ...base,
          {
            id: crypto.randomUUID(),
            sender: "other",
            content: progressText,
            kind: "progress",
          },
        ];
      });
      return;
    }

    setMessages((prev) => prev.filter((m) => m.kind !== "progress"));
    setIsWaitingForBot(false);
    applyVisualizationFromCustom(custom);
  }, [applyVisualizationFromCustom]);

  const handleIncomingPayload = useCallback((payload: unknown) => {
    const obj = payload as { text?: unknown; custom?: unknown; type?: unknown } | null;
    if (!obj || typeof obj !== "object") return;

    if (obj.type === "connected") {
      return;
    }

    if (typeof obj.text === "string" && obj.text.length > 0) {
      setIsWaitingForBot(false);
      setMessages((prev) => prev.filter((m) => m.kind !== "progress"));
      const botMsg: Message = {
        id: crypto.randomUUID(),
        sender: "other",
        content: obj.text,
        debug: {
          pending: true,
          source: "live-stream",
        },
      };
      setMessages((prev) => [...prev, botMsg]);
      scheduleHydration();
    }

    if (obj.custom) {
      const customObj = obj.custom as { progress?: unknown } | null;
      const isProgressUpdate =
        !!customObj &&
        typeof customObj === "object" &&
        typeof customObj.progress === "string";

      handleCustomPayload(obj.custom);
      if (!isProgressUpdate) {
        scheduleHydration();
      }
    }
  }, [handleCustomPayload, scheduleHydration]);

 useEffect(() => {
    return () => {
      if (hydrationTimerRef.current) {
        clearTimeout(hydrationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    seenPlanMessageKeysRef.current.clear();

    let cancelled = false;

    if (!currentThreadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const threadId = currentThreadId;

    async function fetchMessages() {
      setLoading(true);
      try {
        const { mapped, customPayloads, error, status } = await fetchThreadHistory(threadId);

        if (!cancelled) {
          if (error && status !== 404) {
            console.warn("History request degraded:", error);
          }

          setMessages((prev) => {
            const carryOver = prev.filter((m) => m.kind === "progress" || m.kind === "plan");
            return carryOver.length > 0 ? [...mapped, ...carryOver] : mapped;
          });
          for (const customPayload of customPayloads) {
            applyVisualizationFromCustom(customPayload);
          }
        }
      } catch (err) {
        console.error("Failed to fetch thread history", err);
        if (!cancelled) {
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setTimeout(() => setLoading(false), 150);
        }
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [applyVisualizationFromCustom, currentThreadId]);

  useEffect(() => {
    if (!currentThreadId) return;

    const es = new EventSource(`/api/rasa/stream?threadId=${currentThreadId}`, { withCredentials: true });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data ?? "null");
        handleIncomingPayload(data);
      } catch (err) {
        console.error("SSE message parse error:", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      es.close();
    };
  }, [currentThreadId, handleIncomingPayload]);

  const sendMessage = async (msg: string) => {
    if (!currentThreadId) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("thread-activity", {
        detail: { threadId: currentThreadId },
      })
    );

    setIsWaitingForBot(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: msg,
      debug: {
        pending: true,
        source: "live-input",
      },
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/rasa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify({ message: msg, threadId: currentThreadId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/x-ndjson") || contentType.includes("application/json")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split(/\r?\n/);
            buf = lines.pop() || "";
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const obj = JSON.parse(line);
                handleIncomingPayload(obj);
              } catch (e) {
                console.warn("NDJSON parse error:", e);
              }
            }
          }
        }
      } else {
        const data = await res.json();
        if (data.reply !== "") {
          setIsWaitingForBot(false);
          const botMsg: Message = {
            id: crypto.randomUUID(),
            sender: "other",
            content: data.reply,
            debug: {
              pending: true,
              source: "live-response",
            },
          };
          setMessages((prev) => [...prev, botMsg]);
        }
        applyVisualizationFromCustom(data.custom);
      }
      scheduleHydration();
    } catch (err) {
      setIsWaitingForBot(false);
      console.error("/api/rasa error:", err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        sender: "other",
        content: t('chat.error'),
        debug: {
          pending: true,
          source: "live-error",
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className=" flex flex-col h-full">
      <div className="gap-0 bg-transparent relative min-h-0 flex-none"  >  
        <div className="w-[101%] h-15 rounded-t-xl z-10 flex items-center justify-between px-10 bg-gradient-to-tl from-secondary to-primary">
          <div className="flex w-full gap-2 items-center h-full min-h-">
            <p className="text-white font-semibold">{t('robot.intro')}</p><RobotIcon className="w-6 h-6 min-h-6" />
          </div>
        </div>
        <WaveAsset className=" absolute w-full max-h-15 min-h-10 fill-gradient-to-r from-primary to-accent align-self bg-transparent z-1 p-0" />
      </div>
      <div className=" p-4 flex-1 pt-0 flex flex-col h-full min-h-0 w-full">
        {loading ? (
          <div className="flex-1 flex flex-col gap-3 h-full w-full">
            <div className="flex flex-col h-full gap-2 w-full">
              <Skeleton className="h-6 max-w-[60%] mt-10 bg-muted" />
              <Skeleton className="h-6 max-w-[70%] bg-muted" />
              <Skeleton className="h-6 max-w-[70%] bg-muted" />
              <Skeleton className="h-6 max-w-[50%] bg-muted" />
              <Skeleton className="h-6 max-w-[60%] mt-10 bg-muted" />
              <Skeleton className="h-6 max-w-[70%] bg-muted" />
              <Skeleton className="h-6 max-w-[50%] bg-muted" />
            </div>
          </div>
         ) : (
          <ChatMessageList messages={messages} currentThreadId={currentThreadId} />
        )}
        <ChatInput onSubmit={sendMessage} loading={isWaitingForBot} />
      </div>
    </div>
  );
}
