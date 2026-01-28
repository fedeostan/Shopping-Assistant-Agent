'use client'

import { useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Message, MessageContent } from '@/types/chat'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Json } from '@/types/database'

interface MessageRow extends Record<string, unknown> {
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
  const { addMessage, setMessages } = useChatStore()

  // Use singleton client via ref (stable reference)
  const supabaseRef = useRef(getSupabaseClient())

  // Handler for realtime changes - uses store.getState() to avoid closure issues
  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<MessageRow>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const currentMessages = useChatStore.getState().messages

      switch (eventType) {
        case 'INSERT': {
          if (!newRecord || newRecord.conversation_id !== conversationId) return

          // Check if we already have this message (from optimistic update)
          const exists = currentMessages.some((m) => m.id === newRecord.id)
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
          const filtered = currentMessages.filter((m) => m.id !== oldRecord.id)
          if (filtered.length !== currentMessages.length) {
            setMessages(filtered)
          }
          break
        }
      }
    },
    [conversationId, addMessage, setMessages]
  )

  // Refetch messages on reconnection to catch any missed updates
  const handleReconnect = useCallback(async () => {
    if (!conversationId) return

    const { data, error } = await supabaseRef.current
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const messages: Message[] = data.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role as 'user' | 'assistant',
        content: parseMessageContent(row as MessageRow),
        createdAt: new Date(row.created_at || Date.now()),
      }))
      setMessages(messages)
    }
  }, [conversationId, setMessages])

  // CRITICAL: Only subscribe when conversationId is valid and non-empty
  // Pass null as subscriptionKey to disable subscription when no conversation
  return useRealtimeSubscription<MessageRow>({
    subscriptionKey: conversationId && conversationId.trim() !== '' ? conversationId : null,
    channelPrefix: 'messages',
    table: 'messages',
    // Filter value is validated by useRealtimeSubscription
    filter: { column: 'conversation_id', value: conversationId || '' },
    onPayload: handlePayload,
    onReconnect: handleReconnect,
    showErrorToast: false, // Messages hook doesn't show toast (conversation hook does)
  })
}
