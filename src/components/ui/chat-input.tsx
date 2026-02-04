'use client'

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/i18n"
import { SendIcon } from "./Icons/send-icon"

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void> | void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSubmit,
  placeholder,
  disabled = false,
  className = "",
}: ChatInputProps) {
  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation('common')

  const computedPlaceholder = placeholder ?? t('chat.placeholder')

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
    <div className={`relative ${className}`}>
      <Textarea
        ref={textareaRef}
        placeholder={computedPlaceholder}
        aria-label={computedPlaceholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        rows={1}
        className=" min-h-9 resize-none transition-all duration-100 ease-in-out"
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || disabled || !message.trim()}
        size="icon"
        aria-label={t('chat.send')}
        title={t('chat.send')}
        className="absolute right-1 bottom-0 -translate-y-1/2 translate-x-4 rounded-full"
      >
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <SendIcon width={50} height={50} className="fill-background" />}
      </Button>
    </div>
  )
}
