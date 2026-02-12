import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <div className="w-full">
      <hr className={cn(
        "h-px bg-border transition-all duration-100 p-1px",
        isFocused && "h-1 bg-ring"
      )} />
      <textarea
        data-slot="textarea"
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        className={cn(
          "placeholder:text-muted-foreground  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-card field-sizing-content min-h-20 w-full rounded-none py-3 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-6 flex-shrink-0",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { Textarea }
