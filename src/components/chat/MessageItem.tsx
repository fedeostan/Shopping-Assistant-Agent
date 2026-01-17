'use client'

import { User, Bot } from 'lucide-react'
import type { Message, PersonaType } from '@/types/chat'
import { MessageContentRenderer } from './messages'

interface MessageItemProps {
  message: Message
  persona?: PersonaType
}

export function MessageItem({ message, persona }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent" aria-hidden="true" />
        </div>
      )}
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-surface rounded-2xl rounded-br-md px-4 py-3 shadow-sm'
            : ''
        }`}
      >
        <MessageContentRenderer
          content={message.content}
          isUser={isUser}
          persona={persona}
        />
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <User className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
