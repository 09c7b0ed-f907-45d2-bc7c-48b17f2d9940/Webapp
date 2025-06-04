import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  sender: "me" | "other";
  isTyping?: boolean;
}

export default function ChatBubble({
  message,
  sender,
  isTyping = false,
}: ChatBubbleProps) {
  const isMe = sender === "me";

  return (
    <div className={cn("flex gap-2 items-end px-4", isMe ? "justify-end" : "justify-start")}>      
      <div
        className={cn(
          "w-fit max-w-[90%] px-4 py-2 shadow-md",
          isMe
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none"
            : "bg-muted rounded-2xl rounded-bl-none"
        )}
      >
        {isTyping ? (
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        )}
      </div>
    </div>
  );
}
