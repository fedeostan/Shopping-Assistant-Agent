'use client'

import { Loader2 } from 'lucide-react'

interface ThinkingIndicatorProps {
  text?: string
  className?: string
}

/**
 * Animated thinking indicator shown while the assistant is processing
 */
export function ThinkingIndicator({
  text = 'Thinking...',
  className = '',
}: ThinkingIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 text-text-muted ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

/**
 * Dot-based thinking indicator as an alternative style
 */
export function ThinkingDots({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
    </div>
  )
}
