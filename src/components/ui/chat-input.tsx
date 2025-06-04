'use client'

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2 } from "lucide-react"

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void> | void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  className = "",
}: ChatInputProps) {
  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const MAX_HEIGHT = 160

  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT)
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden"
    }
  }, [message])

  const handleSubmit = async () => {
    const trimmed = message.trim()
    if (!trimmed || isLoading || disabled) return

    setIsLoading(true)
    try {
      await onSubmit(trimmed)
      setMessage("")
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    } catch (err) {
      console.error("Submit error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={`flex items-end space-x-2 ${className}`}>
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        rows={1}
        className="flex-1 min-h-9 resize-none transition-all duration-100 ease-in-out"
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || disabled || !message.trim()}
        size="icon"
      >
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}
