'use client'

import { ShoppingBag } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void
}

export function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const { messages, isLoading } = useChatStore()

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessageList messages={messages} />
      )}
      <div className="shrink-0 p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSendMessage}
            disabled={isLoading}
            placeholder="Ask about products, get recommendations..."
          />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-light flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-accent" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-text-header mb-3">
          Your Shopping Assistant
        </h2>
        <p className="text-text-muted mb-6">
          Tell me what you&apos;re looking for and I&apos;ll help you find the
          perfect products based on your preferences and style.
        </p>
        <div className="space-y-2 text-sm text-text-body">
          <p>Try asking:</p>
          <ul className="space-y-1 text-text-muted">
            <li>&ldquo;I need a birthday gift for my mom&rdquo;</li>
            <li>&ldquo;Find me running shoes under $100&rdquo;</li>
            <li>&ldquo;What are the best wireless earbuds?&rdquo;</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
