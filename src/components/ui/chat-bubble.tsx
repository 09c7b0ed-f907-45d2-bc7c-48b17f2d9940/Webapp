import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  sender: "me" | "other";
  isTyping?: boolean;
  isProgress?: boolean;
}

export default function ChatBubble({
  message,
  sender,
  isTyping = false,
  isProgress = false,
}: ChatBubbleProps) {
  const isMe = sender === "me";

  return (
    <div className={cn("flex gap-2 items-end px-1 w-auto", isMe ? "justify-end" : "justify-start")}>      
      <div
        className={cn(
          "w-fit max-w-[90%] px-4 py-2 shadow-md overflow-x-hidden",
          isMe
            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-3xl rounded-br-none"
            : isProgress
              ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50 rounded-2xl rounded-bl-none"
              : "bg-muted rounded-3xl rounded-bl-none"
        )}
      >
        {isTyping ? (
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          </div>
        ) : (
          <p className="max-w-fit text-sm whitespace-pre-wrap break-words hyphens-auto" style={{ overflowWrap: "anywhere" }}>{message}</p>
        )}
      </div>
    </div>
  );
}
