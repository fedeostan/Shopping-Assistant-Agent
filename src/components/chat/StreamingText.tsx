'use client'

import { useEffect, useRef, useState } from 'react'

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
  className?: string
  cursorClassName?: string
  showCursor?: boolean
}

/**
 * Renders text with an optional animated cursor for streaming effect
 * Cursor appears when streaming and fades away after streaming stops
 */
export function StreamingText({
  text,
  isStreaming = false,
  className = '',
  cursorClassName = '',
  showCursor = true,
}: StreamingTextProps) {
  // Simple approach: just show cursor while streaming
  // Use CSS transition for smooth hide after streaming ends
  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {text}
      {showCursor && (
        <span
          className={`inline-block w-[2px] h-[1em] bg-text-muted ml-0.5 align-middle transition-opacity duration-300 ${
            isStreaming ? 'opacity-100 animate-pulse' : 'opacity-0'
          } ${cursorClassName}`}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

interface TypewriterTextProps {
  text: string
  speed?: number // milliseconds per character
  className?: string
  onComplete?: () => void
}

/**
 * Internal implementation that handles the typing animation
 */
function TypewriterInternal({
  text,
  speed,
  className,
  onComplete,
}: Required<Pick<TypewriterTextProps, 'text' | 'speed' | 'className'>> & {
  onComplete?: () => void
}) {
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!text) {
      onComplete?.()
      return
    }

    intervalRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1
        if (next >= text.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          if (!completedRef.current) {
            completedRef.current = true
            // Defer callback to avoid calling during state update
            setTimeout(() => onComplete?.(), 0)
          }
          return text.length
        }
        return next
      })
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [text, speed, onComplete])

  const isComplete = index >= text.length
  const displayedText = text.slice(0, index)

  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {displayedText}
      {!isComplete && (
        <span
          className="inline-block w-[2px] h-[1em] bg-text-muted animate-pulse ml-0.5 align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  )
}

/**
 * Typewriter effect for text - types out character by character
 * Use for dramatic reveals or emphasis
 */
export function TypewriterText({
  text,
  speed = 20,
  className = '',
  onComplete,
}: TypewriterTextProps) {
  // Use text as key to completely remount when text changes
  return (
    <TypewriterInternal
      key={text}
      text={text}
      speed={speed}
      className={className}
      onComplete={onComplete}
    />
  )
}
