'use client'

import { useEffect, useRef, useMemo } from 'react'
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

  // Use ref to access latest conversations without triggering re-subscriptions
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), [])

  // Track if we've shown an error toast to prevent spam
  const hasShownErrorRef = useRef(false)

  useEffect(() => {
    if (!userId) return

    // Reset error state when userId changes
    hasShownErrorRef.current = false

    // Handler uses ref to access latest state
    const handleConversationChange = (
      payload: RealtimePostgresChangesPayload<ConversationRow>
    ) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const currentConversations = conversationsRef.current

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
    }

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
          hasShownErrorRef.current = false // Reset on successful connection
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime: Channel error for conversations')
          // Only show error toast once to prevent spam
          if (!hasShownErrorRef.current) {
            hasShownErrorRef.current = true
            toast.error('Failed to connect to realtime updates')
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, setConversations, updateConversationTitle])
}
