'use client'

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatBubble from "@/components/ui/chat-bubble";

type Message = {
  id: string;
  sender: "user" | "other";
  content: string;
  kind?: "normal" | "progress";
};

type Props = {
  messages: Message[];
};

export default function ChatMessageList({ messages }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex-1  h-0 min-w-0">
      <ScrollArea className="h-full w-full ">
        <div className="flex flex-col gap-2 p-2 pt-10">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.content}
              sender={msg.sender === "user" ? "me" : "other"}
              isProgress={msg.kind === "progress"}
            />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
