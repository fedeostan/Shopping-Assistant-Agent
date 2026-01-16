'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/types/chat'

export default function NewChatPage() {
  const router = useRouter()
  const {
    createConversation,
    addMessage,
    setActiveConversation,
    setIsLoading,
  } = useChatStore()

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setIsLoading(true)

      try {
        // Generate IDs
        const conversationId = crypto.randomUUID()
        const n8nSessionId = crypto.randomUUID()
        const messageId = crypto.randomUUID()

        // Create conversation in database
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            id: conversationId,
            user_id: user.id,
            n8n_session_id: n8nSessionId,
            title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
          })

        if (convError) {
          console.error('Failed to create conversation:', convError)
          return
        }

        // Create message in database
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            id: messageId,
            conversation_id: conversationId,
            role: 'user',
            content: messageText,
            message_type: 'text',
          })

        if (msgError) {
          console.error('Failed to save message:', msgError)
        }

        // Update local state
        const newConversation: Conversation = {
          id: conversationId,
          title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
          n8nSessionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const userMessage: Message = {
          id: messageId,
          conversationId,
          role: 'user',
          content: { type: 'text', content: messageText },
          createdAt: new Date(),
        }

        createConversation(newConversation)
        addMessage(userMessage)
        setActiveConversation(conversationId)

        // Navigate to the conversation page
        router.push(`/chat/${conversationId}`)

        // Add thinking indicator for assistant
        const thinkingId = crypto.randomUUID()
        addMessage({
          id: thinkingId,
          conversationId,
          role: 'assistant',
          content: { type: 'thinking' },
          createdAt: new Date(),
        })

        // TODO: Phase 3 - Call n8n webhook and handle streaming response
        // For now, just simulate a response
        setTimeout(() => {
          useChatStore.getState().updateMessage(thinkingId, {
            type: 'text',
            content: 'Hello! I\'m your Shopping Assistant. I can help you find products, compare options, and make recommendations based on your preferences. What are you looking for today?',
          })
          setIsLoading(false)
        }, 1500)
      } catch (error) {
        console.error('Error sending message:', error)
        setIsLoading(false)
      }
    },
    [router, createConversation, addMessage, setActiveConversation, setIsLoading]
  )

  return <ChatInterface onSendMessage={handleSendMessage} />
}
