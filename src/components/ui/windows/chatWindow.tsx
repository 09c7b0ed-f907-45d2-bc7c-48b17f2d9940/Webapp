"use client"

import { useEffect, useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import ChatMessageList from "@/components/ui/chat-message-list";
import { useChatStore } from "@/store/useChatStore";
import type { VisualizationResponseDTO } from "@/models/dto/response";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import "@/i18n";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
  kind?: "normal" | "progress";
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation('common');

  const applyVisualizationFromCustom = (custom: unknown) => {
    const viz = (custom ?? null) as VisualizationResponseDTO | null;
    if (viz?.charts && Array.isArray(viz.charts) && viz.schema_version === 1) {
      const { setVisualization, addToHistory, setSelectedChartIndex } = useChatStore.getState();
      setVisualization(viz);
      addToHistory(viz);
      setSelectedChartIndex(0);
    }
  };

  useEffect(() => {
    const es = new EventSource("/api/rasa/stream", { withCredentials: true });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data ?? "null");
        if (!data || typeof data !== "object") return;

        if (data.type === "long-task-result") {
          const custom = (data as any).custom;
          const progressText =
            custom && typeof custom === "object" && typeof (custom as any).progress === "string"
              ? (custom as any).progress
              : null;

          if (progressText) {
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

          // Any non-progress callback should clear existing progress bubbles.
          setMessages((prev) => prev.filter((m) => m.kind !== "progress"));

          if (typeof data.text === "string" && data.text.length > 0) {
            const botMsg: Message = {
              id: crypto.randomUUID(),
              sender: "other",
              content: data.text,
            };
            setMessages((prev) => [...prev, botMsg]);
          }
          if (custom) {
            applyVisualizationFromCustom(custom);
          }
        }
      } catch (err) {
        console.error("SSE message parse error:", err);
      }
    };

    es.onerror = (err) => {
      // Let EventSource handle automatic reconnection; just log the error.
      console.error("SSE connection error:", err);
    };

    return () => {
      es.close();
    };
  }, []);

  const sendMessage = async (msg: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: msg,
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/rasa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify({ message: msg }),
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/x-ndjson") || contentType.includes("application/json")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let hasAnyText = false;
        let lastBotMsgId: string | null = null;

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
                if (typeof obj.text === "string" && obj.text.length > 0) {
                  hasAnyText = true;
                  if (!lastBotMsgId) {
                    lastBotMsgId = crypto.randomUUID();
                    setMessages((prev) => [...prev, { id: lastBotMsgId!, sender: "other", content: obj.text }]);
                  } else {
                    const id = lastBotMsgId;
                    setMessages((prev) => prev.map(m => m.id === id ? { ...m, content: m.content ? `${m.content}\n${obj.text}` : obj.text } : m));
                  }
                }
                if (obj.custom) {
                  applyVisualizationFromCustom(obj.custom);
                }
              } catch (e) {
                console.warn("NDJSON parse error:", e);
              }
            }
          }
        }

        if (!hasAnyText) {
          // No-op; some actions might only emit custom payloads.
        }
      } else {
        const data = await res.json();
        if (data.reply !== "") {
          const botMsg: Message = {
            id: crypto.randomUUID(),
            sender: "other",
            content: data.reply,
          };
          setMessages((prev) => [...prev, botMsg]);
        }
        applyVisualizationFromCustom(data.custom);
      }
    } catch (err) {
      console.error("/api/rasa error:", err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        sender: "other",
        content: t('chat.error'),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList messages={messages} />
      <ChatInput onSubmit={sendMessage} disabled={false} />
    </div>
  );
}
