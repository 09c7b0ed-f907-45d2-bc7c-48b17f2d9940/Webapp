"use client"

import { useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";
import ChatMessageList from "@/components/ui/chat-message-list";
import { useChatStore } from "@/store/useChatStore";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = async (msg: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: msg,
    };

    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch("/api/rasa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
      credentials: "include",
    });

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
      setVisualization(data.custom);
      addToHistory(data.custom);
      setSelectedChartIndex(0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList messages={messages} />
      <ChatInput onSubmit={sendMessage} disabled={false} />
    </div>
  );
}
