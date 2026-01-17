'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { createClient } from '@/lib/supabase/client'
import { useChat } from '@/hooks/useChat'
import type { Message } from '@/types/chat'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [dbSessionId, setDbSessionId] = useState<string | undefined>()
  const [isReady, setIsReady] = useState(false)

  const {
    setActiveConversation,
    setMessages,
    conversations,
  } = useChatStore()

  // Get session ID from store (for newly created conversations) or from DB
  const n8nSessionId = useMemo(() => {
    // First check store (handles newly created conversations)
    const storeConversation = conversations.find((c) => c.id === conversationId)
    if (storeConversation?.n8nSessionId) {
      return storeConversation.n8nSessionId
    }
    // Fall back to DB value
    return dbSessionId
  }, [conversations, conversationId, dbSessionId])

  const { sendMessage, error } = useChat({
    conversationId,
    n8nSessionId,
    onError: (err) => console.error('Chat error:', err),
  })

  // Load messages for this conversation
  useEffect(() => {
    async function loadMessages() {
      const supabase = createClient()

      // Verify conversation exists and belongs to user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (!conversation) {
        router.push('/chat')
        return
      }

      setDbSessionId(conversation.n8n_session_id ?? undefined)
      setActiveConversation(conversationId)

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        const messages: Message[] = messagesData.map((row) => ({
          id: row.id,
          conversationId: row.conversation_id,
          role: row.role as 'user' | 'assistant',
          content: parseMessageContent(row.content, row.message_type, row.metadata),
          createdAt: new Date(row.created_at || Date.now()),
        }))
        setMessages(messages)
      }

      setIsReady(true)
    }

    loadMessages()
  }, [conversationId, router, setActiveConversation, setMessages])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <>
      <ChatInterface onSendMessage={sendMessage} />
      {error && (
        <div
          role="alert"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-700 px-4 py-2 rounded-lg shadow-md text-sm"
        >
          {error}
        </div>
      )}
    </>
  )
}

// Helper to parse message content from database
function parseMessageContent(
  content: string,
  messageType: string | null,
  metadata: unknown
): Message['content'] {
  switch (messageType) {
    case 'product':
      return {
        type: 'product',
        product: (metadata as { product: Message['content'] extends { type: 'product'; product: infer P } ? P : never }).product,
      }
    case 'product-list':
      return {
        type: 'product-list',
        products: (metadata as { products: Message['content'] extends { type: 'product-list'; products: infer P } ? P : never }).products,
      }
    case 'tool-call':
      return {
        type: 'tool-call',
        toolName: (metadata as { toolName: string }).toolName,
        status: 'complete',
      }
    case 'text':
    default:
      return { type: 'text', content }
  }
}
