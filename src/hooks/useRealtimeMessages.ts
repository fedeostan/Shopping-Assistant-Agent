'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import type { Message, MessageContent } from '@/types/chat'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Json } from '@/types/database'

interface MessageRow {
  id: string
  conversation_id: string
  role: string
  content: string
  message_type: string
  metadata: Json | null
  created_at: string | null
}

function parseMessageContent(row: MessageRow): MessageContent {
  const { message_type, content, metadata } = row

  switch (message_type) {
    case 'product':
      if (metadata && typeof metadata === 'object' && 'product' in metadata) {
        return {
          type: 'product',
          product: metadata.product as MessageContent extends { type: 'product' } ? MessageContent['product'] : never,
        }
      }
      return { type: 'text', content }

    case 'product-list':
      if (metadata && typeof metadata === 'object' && 'products' in metadata) {
        return {
          type: 'product-list',
          products: metadata.products as MessageContent extends { type: 'product-list' } ? MessageContent['products'] : never,
        }
      }
      return { type: 'text', content }

    case 'tool-call':
      if (metadata && typeof metadata === 'object' && 'toolName' in metadata) {
        return {
          type: 'tool-call',
          toolName: String(metadata.toolName),
          status: 'complete' as const,
        }
      }
      return { type: 'text', content }

    case 'thinking':
      return { type: 'thinking' }

    default:
      return { type: 'text', content }
  }
}

export function useRealtimeMessages(conversationId: string | null) {
  const { messages, addMessage, setMessages } = useChatStore()

  const handleMessageChange = useCallback(
    (payload: RealtimePostgresChangesPayload<MessageRow>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      switch (eventType) {
        case 'INSERT': {
          if (!newRecord || newRecord.conversation_id !== conversationId) return

          // Check if we already have this message (from optimistic update)
          const exists = messages.some((m) => m.id === newRecord.id)
          if (exists) return

          const newMessage: Message = {
            id: newRecord.id,
            conversationId: newRecord.conversation_id,
            role: newRecord.role as 'user' | 'assistant',
            content: parseMessageContent(newRecord),
            createdAt: new Date(newRecord.created_at || Date.now()),
          }

          addMessage(newMessage)
          break
        }

        case 'DELETE': {
          if (!oldRecord) return
          const filtered = messages.filter((m) => m.id !== oldRecord.id)
          if (filtered.length !== messages.length) {
            setMessages(filtered)
          }
          break
        }
      }
    },
    [conversationId, messages, addMessage, setMessages]
  )

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()

    // Subscribe to message changes for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on<MessageRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        handleMessageChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: Subscribed to messages')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, handleMessageChange])
}
