"use client"

import { useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import ChatMessageList from "@/components/ui/chat-message-list";
import { useChatStore } from "@/store/useChatStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import "@/i18n";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation('common');

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

      const data = await res.json();
      if (data.reply !== "") {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          sender: "other",
          content: data.reply,
        };
        setMessages((prev) => [...prev, botMsg]);
      }

      const { setVisualization, addToHistory, setSelectedChartIndex } = useChatStore.getState();

      if (data.custom) {
        const chartsData = data.custom?.charts ?? data.custom;
        setVisualization(chartsData);
        addToHistory(chartsData);
        setSelectedChartIndex(0);
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
