'use client'

import { useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/chat'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const {
    setActiveConversation,
    setMessages,
    addMessage,
    setIsLoading,
    conversations,
  } = useChatStore()

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
    }

    loadMessages()
  }, [conversationId, router, setActiveConversation, setMessages])

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
        const messageId = crypto.randomUUID()

        // Save message to database
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

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)

        // Add message to local state
        const userMessage: Message = {
          id: messageId,
          conversationId,
          role: 'user',
          content: { type: 'text', content: messageText },
          createdAt: new Date(),
        }
        addMessage(userMessage)

        // Get the conversation's n8n session ID (used in Phase 3)
        const conversation = conversations.find((c) => c.id === conversationId)
        const _n8nSessionId = conversation?.n8nSessionId

        // Add thinking indicator
        const thinkingId = crypto.randomUUID()
        addMessage({
          id: thinkingId,
          conversationId,
          role: 'assistant',
          content: { type: 'thinking' },
          createdAt: new Date(),
        })

        // TODO: Phase 3 - Call n8n webhook with n8nSessionId and handle streaming response
        // For now, simulate a response
        setTimeout(async () => {
          const responseText = 'I understand you\'re looking for help. Let me search for some options that match your preferences.'

          // Update thinking to response
          useChatStore.getState().updateMessage(thinkingId, {
            type: 'text',
            content: responseText,
          })

          // Save assistant message to database
          await supabase
            .from('messages')
            .insert({
              id: thinkingId,
              conversation_id: conversationId,
              role: 'assistant',
              content: responseText,
              message_type: 'text',
            })

          setIsLoading(false)
        }, 1500)
      } catch (error) {
        console.error('Error sending message:', error)
        setIsLoading(false)
      }
    },
    [conversationId, router, addMessage, setIsLoading, conversations]
  )

  return <ChatInterface onSendMessage={handleSendMessage} />
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
