'use client'

import { useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useChatStore } from '@/stores/chat-store'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { toast } from '@/stores/toast-store'
import type { Conversation } from '@/types/chat'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface ConversationRow extends Record<string, unknown> {
  id: string
  title: string | null
  n8n_session_id: string | null
  created_at: string | null
  updated_at: string | null
  user_id: string
}

export function useRealtimeConversations(userId: string | null) {
  const { setConversations, updateConversationTitle } = useChatStore()

  // Use singleton client via ref (stable reference)
  const supabaseRef = useRef(getSupabaseClient())

  // Handler for realtime changes - uses store.getState() to avoid closure issues
  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const currentConversations = useChatStore.getState().conversations

      switch (eventType) {
        case 'INSERT': {
          if (!newRecord) return
          // Check if we already have this conversation (from optimistic update)
          const exists = currentConversations.some((c) => c.id === newRecord.id)
          if (exists) return

          const newConversation: Conversation = {
            id: newRecord.id,
            title: newRecord.title,
            n8nSessionId: newRecord.n8n_session_id || '',
            createdAt: new Date(newRecord.created_at || Date.now()),
            updatedAt: new Date(newRecord.updated_at || Date.now()),
          }

          setConversations([newConversation, ...currentConversations])
          break
        }

        case 'UPDATE': {
          if (!newRecord) return
          // Only update title if it changed (avoid unnecessary re-renders)
          const existing = currentConversations.find((c) => c.id === newRecord.id)
          if (existing && existing.title !== newRecord.title) {
            updateConversationTitle(newRecord.id, newRecord.title || '')
          }
          break
        }

        case 'DELETE': {
          if (!oldRecord) return
          const filtered = currentConversations.filter((c) => c.id !== oldRecord.id)
          if (filtered.length !== currentConversations.length) {
            setConversations(filtered)
            toast.info('Conversation deleted')
          }
          break
        }
      }
    },
    [setConversations, updateConversationTitle]
  )

  // Refetch conversations on reconnection to catch any missed updates
  const handleReconnect = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabaseRef.current
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      const conversations: Conversation[] = data.map((row) => ({
        id: row.id,
        title: row.title,
        n8nSessionId: row.n8n_session_id || '',
        createdAt: new Date(row.created_at || Date.now()),
        updatedAt: new Date(row.updated_at || Date.now()),
      }))
      setConversations(conversations)
    }
  }, [userId, setConversations])

  // CRITICAL: Only subscribe when userId is valid and non-empty
  // Pass null as subscriptionKey to disable subscription when no user
  return useRealtimeSubscription<ConversationRow>({
    subscriptionKey: userId && userId.trim() !== '' ? userId : null,
    channelPrefix: 'conversations',
    table: 'conversations',
    // Filter value is validated by useRealtimeSubscription, but we ensure
    // it's never empty when subscriptionKey is set
    filter: { column: 'user_id', value: userId || '' },
    onPayload: handlePayload,
    onReconnect: handleReconnect,
    showErrorToast: true,
  })
}
