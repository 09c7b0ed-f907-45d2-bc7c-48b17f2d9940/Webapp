"use client"

import { useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import ChatMessageList from "@/components/ui/chat-message-list";
import { useChatStore } from "@/store/useChatStore";
import type { VisualizationResponseDTO } from "@/models/dto/response";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { WaveAsset } from "../assets/wave-asset";
import { RobotIcon } from "../icons/robot-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useThread } from "@/components/ThreadContext";
import { ThreadName } from "../thread-name";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
  kind?: "normal" | "progress";
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
  buttons?: Array<{
    title: string;
    payload: string;
  }>;
};


export default function ChatWindow() {
  const { currentThreadId } = useThread();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWaitingForBot, setIsWaitingForBot] = useState(false);
  const hydrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation('common');

  const hydrateFromHistory = async () => {
    if (!currentThreadId) return;

    try {
      const res = await fetch(`/api/rasa/history?threadId=${currentThreadId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      const customPayloads: unknown[] = [];
      const mapped = (data.history || []).flatMap((item: any) => {
        if (!item || (item.role !== "user" && item.role !== "assistant")) return [];

        if (item.custom && typeof item.custom === "object") {
          customPayloads.push(item.custom);
        }

        if (typeof item.text !== "string") return [];

        return [{
          id: crypto.randomUUID(),
          sender: item.role === "user" ? "user" : "other",
          content: item.text,
          debug: item.debug && typeof item.debug === "object" ? item.debug : undefined,
        } as Message];
      });

      setMessages((prev) => {
        const progress = prev.filter((m) => m.kind === "progress");
        return progress.length > 0 ? [...mapped, ...progress] : mapped;
      });
      for (const customPayload of customPayloads) {
        applyVisualizationFromCustom(customPayload);
      }
    } catch (err) {
      console.error("Silent tracker hydration failed:", err);
    }
  };

  const scheduleHydration = () => {
    if (hydrationTimerRef.current) {
      clearTimeout(hydrationTimerRef.current);
    }

    hydrationTimerRef.current = setTimeout(() => {
      hydrateFromHistory().catch((err) => {
        console.error("Failed to hydrate tracker metadata:", err);
      });
    }, 900);
  };

  const applyVisualizationFromCustom = (custom: unknown) => {
    const viz = (custom ?? null) as VisualizationResponseDTO | null;
    if (viz?.charts && Array.isArray(viz.charts) && viz.schema_version === 1) {
      const { setVisualization, addToHistory, setSelectedChartIndex } = useChatStore.getState();
      setVisualization(viz);
      addToHistory(viz);
      setSelectedChartIndex(0);
    }
  };

  const handleCustomPayload = (custom: unknown) => {
    const obj = custom as any;
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
  };

  const handleIncomingPayload = (payload: unknown) => {
    const obj = payload as { text?: unknown; custom?: unknown; type?: unknown; buttons?: unknown } | null;
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

      // Add buttons if they exist and are in the correct format
      if (Array.isArray(obj.buttons)) {
        const buttons = obj.buttons.filter(
          (btn: any) =>
            btn && typeof btn === "object" &&
            typeof btn.title === "string" &&
            typeof btn.payload === "string"
        ).map((btn: any) => ({
          title: btn.title,
          payload: btn.payload,
        }));
        
        if (buttons.length > 0) {
          botMsg.buttons = buttons;
        }
      }

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
  };

  const handleButtonClick = async (buttonPayload: string) => {
    // Send a formatted message with the button payload
    await sendMessage(`Generate a Graph of my Hospital's ${buttonPayload}`);
  };
 useEffect(() => {
    return () => {
      if (hydrationTimerRef.current) {
        clearTimeout(hydrationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!currentThreadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    async function fetchMessages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rasa/history?threadId=${currentThreadId}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch Rasa history");

        const data = await res.json();
        const customPayloads: unknown[] = [];
        const mapped = (data.history || []).flatMap((item: any) => {
          if (!item || (item.role !== "user" && item.role !== "assistant")) return [];

          if (item.custom && typeof item.custom === "object") {
            customPayloads.push(item.custom);
          }

          if (typeof item.text !== "string") return [];

          return [{
            id: crypto.randomUUID(),
            sender: item.role === "user" ? "user" : "other",
            content: item.text,
            debug: item.debug && typeof item.debug === "object" ? item.debug : undefined,
          } as Message];
        });

        if (!cancelled) {
          setMessages((prev) => {
            const progress = prev.filter((m) => m.kind === "progress");
            return progress.length > 0 ? [...mapped, ...progress] : mapped;
          });
          for (const customPayload of customPayloads) {
            applyVisualizationFromCustom(customPayload);
          }
        }
      } catch (err) {
        console.error(err);
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
  }, [currentThreadId]);

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
  }, [currentThreadId]);

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

    setMessages((prev) => {
      // Remove buttons from all messages when a new message is sent
      const messagesWithoutButtons = prev.map((m) => {
        const { buttons, ...rest } = m;
        return rest;
      });
      return [...messagesWithoutButtons, userMsg];
    });
    //Store user message in thread history
    postMessage(userMsg).catch(err => {
      console.error("Failed to post message to thread:", err);
    });

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
            <ThreadName  />
            {/* <p className="text-white font-semibold">{t('robot.intro')}</p><RobotIcon className="w-6 h-6 min-h-6" /> */}
          </div>
        </div>
        <WaveAsset className=" absolute w-full max-h-15 min-h-10 fill-gradient-to-r from-primary to-accent align-self bg-transparent z-1 p-0 pointer-events-none" />
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
          <ChatMessageList  messages={messages} onButtonClick={handleButtonClick} />
        )}
        <ChatInput onSubmit={sendMessage} loading={isWaitingForBot} />
      </div>
    </div>
  );
}
