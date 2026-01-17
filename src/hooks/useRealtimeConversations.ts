'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import { toast } from '@/stores/toast-store'
import type { Conversation } from '@/types/chat'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface ConversationRow {
  id: string
  title: string | null
  n8n_session_id: string | null
  created_at: string | null
  updated_at: string | null
  user_id: string
}

export function useRealtimeConversations(userId: string | null) {
  const { conversations, setConversations, updateConversationTitle } = useChatStore()

  const handleConversationChange = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      switch (eventType) {
        case 'INSERT': {
          if (!newRecord) return
          // Check if we already have this conversation (from optimistic update)
          const exists = conversations.some((c) => c.id === newRecord.id)
          if (exists) return

          const newConversation: Conversation = {
            id: newRecord.id,
            title: newRecord.title,
            n8nSessionId: newRecord.n8n_session_id || '',
            createdAt: new Date(newRecord.created_at || Date.now()),
            updatedAt: new Date(newRecord.updated_at || Date.now()),
          }

          setConversations([newConversation, ...conversations])
          break
        }

        case 'UPDATE': {
          if (!newRecord) return
          // Only update title if it changed (avoid unnecessary re-renders)
          const existing = conversations.find((c) => c.id === newRecord.id)
          if (existing && existing.title !== newRecord.title) {
            updateConversationTitle(newRecord.id, newRecord.title || '')
          }
          break
        }

        case 'DELETE': {
          if (!oldRecord) return
          const filtered = conversations.filter((c) => c.id !== oldRecord.id)
          if (filtered.length !== conversations.length) {
            setConversations(filtered)
            toast.info('Conversation deleted')
          }
          break
        }
      }
    },
    [conversations, setConversations, updateConversationTitle]
  )

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Subscribe to conversation changes for this user
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on<ConversationRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        handleConversationChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: Subscribed to conversations')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: Channel error')
          toast.error('Failed to connect to realtime updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleConversationChange])
}
