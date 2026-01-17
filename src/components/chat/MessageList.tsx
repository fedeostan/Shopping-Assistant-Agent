'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import type { Message, PersonaType } from '@/types/chat'

interface MessageListProps {
  messages: Message[]
  persona?: PersonaType
}

export function MessageList({ messages, persona }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6"
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} persona={persona} />
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  )
}
