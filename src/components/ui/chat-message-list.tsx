'use client'

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatBubble from "@/components/ui/chat-bubble";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const CHAT_DEBUG_MODE = process.env.NODE_ENV === "development";

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

type Props = {
  messages: Message[];
  onButtonClick?: (payload: string) => void;
};

export default function ChatMessageList({ messages, onButtonClick }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  function stringifyDebugMetadata(debug: Message["debug"]): string {
    if (!debug) return "";
    try {
      return JSON.stringify(debug, null, 2);
    } catch {
      return "";
    }
  }

  async function copyToClipboard(value: string): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Failed to copy text to clipboard:", err);
    }
  }

  function formatSingleMessage(msg: Message, includeMetadata: boolean): string {
    const sender = msg.sender === "user" ? "user" : "assistant";
    if (!includeMetadata) {
      return msg.content;
    }

    const metadata = stringifyDebugMetadata(msg.debug);
    return [
      `sender: ${sender}`,
      `message: ${msg.content}`,
      metadata ? `metadata: ${metadata}` : "metadata: {}",
    ].join("\n");
  }

  function formatAllMessages(includeMetadata: boolean): string {
    return messages
      .map((msg, index) => {
        const sender = msg.sender === "user" ? "user" : "assistant";
        const prefix = `#${index + 1} ${sender}: ${msg.content}`;

        if (!includeMetadata) {
          return prefix;
        }

        const metadata = stringifyDebugMetadata(msg.debug);
        return [prefix, metadata ? `metadata: ${metadata}` : "metadata: {}"].join("\n");
      })
      .join("\n\n");
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex-1  h-0 min-w-0">
      <ScrollArea className="h-full w-full ">
        <div className="flex flex-col gap-2 p-2 pt-10">
          {messages.map((msg) => (
            CHAT_DEBUG_MODE ? (
              <ContextMenu key={msg.id}>
                <ContextMenuTrigger asChild>
                  <div>
                    <ChatBubble
                      message={msg.content}
                      sender={msg.sender === "user" ? "me" : "other"}
                      isProgress={msg.kind === "progress"}
                      debug={msg.debug}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-72">
                  <ContextMenuItem onSelect={() => void copyToClipboard(formatSingleMessage(msg, false))}>
                    Copy Message
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => void copyToClipboard(formatSingleMessage(msg, true))}>
                    Copy Message + Metadata
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => void copyToClipboard(formatAllMessages(false))}>
                    Copy All Messages
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => void copyToClipboard(formatAllMessages(true))}>
                    Copy All Messages + Metadata
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                sender={msg.sender === "user" ? "me" : "other"}
                isProgress={msg.kind === "progress"}
                debug={msg.debug}
                buttons={msg.buttons}
              onButtonClick={onButtonClick}
            />
            )
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
