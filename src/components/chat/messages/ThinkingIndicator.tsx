'use client'

import { Loader2, Search, Sparkles, Brain } from 'lucide-react'

export type ThinkingStep =
  | 'thinking'
  | 'searching'
  | 'analyzing'
  | 'generating'

interface ThinkingIndicatorProps {
  step?: ThinkingStep
}

const stepConfig: Record<ThinkingStep, { icon: typeof Loader2; text: string }> = {
  thinking: { icon: Loader2, text: 'Thinking...' },
  searching: { icon: Search, text: 'Searching products...' },
  analyzing: { icon: Brain, text: 'Analyzing your preferences...' },
  generating: { icon: Sparkles, text: 'Generating recommendations...' },
}

export function ThinkingIndicator({ step = 'thinking' }: ThinkingIndicatorProps) {
  const { icon: Icon, text } = stepConfig[step]

  return (
    <div
      className="flex items-center gap-2 text-text-muted"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <Icon className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
