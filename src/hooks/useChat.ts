'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import { parseChunk } from '@/lib/n8n/client'
import type { N8nStreamChunk, N8nToolCallResult } from '@/lib/n8n/types'
import type { Message, MessageContent, Conversation } from '@/types/chat'
import type { Json } from '@/types/database'

interface UseChatOptions {
  conversationId?: string
  n8nSessionId?: string
  onError?: (error: string) => void
}

interface UseChatReturn {
  sendMessage: (text: string) => Promise<void>
  isLoading: boolean
  error: string | null
  abortStream: () => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId, n8nSessionId, onError } = options
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)
  const errorRef = useRef<string | null>(null)

  const {
    addMessage,
    updateMessage,
    createConversation,
    setActiveConversation,
    setIsLoading,
    isLoading,
  } = useChatStore()

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      // Use singleton Supabase client (NOT new instance per message!)
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setIsLoading(true)
      errorRef.current = null

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      // Track if this is a new conversation (for navigation later)
      let isNewConversation = false
      let createdConversationId: string | null = null

      try {
        let activeConversationId = conversationId
        let activeSessionId = n8nSessionId

        // If no conversation exists, create one
        if (!activeConversationId) {
          isNewConversation = true
          const newConversationId = crypto.randomUUID()
          const newSessionId = crypto.randomUUID()

          // Capture the ID for navigation (before any async operations might change state)
          createdConversationId = newConversationId

          // Create conversation in database FIRST
          const { error: convError } = await supabase
            .from('conversations')
            .insert({
              id: newConversationId,
              user_id: user.id,
              n8n_session_id: newSessionId,
              title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
            })

          if (convError) {
            throw new Error(`Failed to create conversation: ${convError.message}`)
          }

          // Create conversation in store
          const newConversation: Conversation = {
            id: newConversationId,
            title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
            n8nSessionId: newSessionId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          createConversation(newConversation)
          setActiveConversation(newConversationId)

          activeConversationId = newConversationId
          activeSessionId = newSessionId
        }

        // Create user message
        const userMessageId = crypto.randomUUID()

        // Save user message to database FIRST
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            id: userMessageId,
            conversation_id: activeConversationId,
            role: 'user',
            content: text,
            message_type: 'text',
          })

        if (msgError) {
          console.error('Failed to save user message:', msgError)
        }

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeConversationId)

        // Add user message to store AFTER DB write succeeds
        const userMessage: Message = {
          id: userMessageId,
          conversationId: activeConversationId,
          role: 'user',
          content: { type: 'text', content: text },
          createdAt: new Date(),
        }
        addMessage(userMessage)

        // FIXED: Navigate AFTER message is in store, using the captured ID
        // Add a microtask delay to ensure React has processed the store update
        if (isNewConversation && createdConversationId) {
          await new Promise(resolve => setTimeout(resolve, 0))
          router.push(`/chat/${createdConversationId}`)
        }

        // Create assistant message (initially thinking)
        const assistantMessageId = crypto.randomUUID()
        const assistantMessage: Message = {
          id: assistantMessageId,
          conversationId: activeConversationId,
          role: 'assistant',
          content: { type: 'thinking' },
          createdAt: new Date(),
        }
        addMessage(assistantMessage)

        // Stream response from API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: activeSessionId,
            message: text,
            conversationId: activeConversationId,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        // Process streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedText = ''
        const toolCalls = new Map<string, { toolName: string; status: 'running' | 'complete' }>()
        let finalContent: MessageContent | null = null as MessageContent | null

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // Process remaining buffer
            if (buffer.trim()) {
              const chunk = parseChunk(buffer)
              if (chunk) {
                processChunk(chunk)
              }
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const chunk = parseChunk(line)
            if (chunk) {
              processChunk(chunk)
            }
          }
        }

        function processChunk(chunk: N8nStreamChunk) {
          switch (chunk.type) {
            case 'begin':
              // Stream started, update from thinking to empty text
              updateMessage(assistantMessageId, { type: 'text', content: '' })
              break

            case 'item':
              // Append text content
              accumulatedText += chunk.content
              updateMessage(assistantMessageId, { type: 'text', content: accumulatedText })
              break

            case 'tool-call-start':
              // Show tool call in progress
              toolCalls.set(chunk.toolCallId, { toolName: chunk.toolName, status: 'running' })
              updateMessage(assistantMessageId, {
                type: 'tool-call',
                toolName: chunk.toolName,
                status: 'running',
              })
              break

            case 'tool-call-end':
              // Update tool call status
              const toolCall = toolCalls.get(chunk.toolCallId)
              if (toolCall) {
                toolCall.status = 'complete'
              }

              // If tool returned products, update message
              if (chunk.result) {
                finalContent = handleToolResult(chunk.result)
                if (finalContent) {
                  updateMessage(assistantMessageId, finalContent)
                }
              }
              break

            case 'end':
              // Stream ended
              if (!finalContent && accumulatedText) {
                finalContent = { type: 'text', content: accumulatedText }
              }
              break

            case 'error':
              errorRef.current = chunk.message
              onError?.(chunk.message)
              updateMessage(assistantMessageId, {
                type: 'text',
                content: `Error: ${chunk.message}`,
              })
              break
          }
        }

        function handleToolResult(result: N8nToolCallResult): MessageContent | null {
          switch (result.type) {
            case 'product':
              return { type: 'product', product: result.product }
            case 'product-list':
              return { type: 'product-list', products: result.products }
            case 'text':
              accumulatedText += result.content
              return { type: 'text', content: accumulatedText }
            default:
              return null
          }
        }

        // Save final assistant message to database
        const messageType = finalContent?.type || 'text'
        const messageContent = finalContent?.type === 'text'
          ? finalContent.content
          : accumulatedText || 'No response'

        const metadata: Json | null = finalContent?.type === 'product'
          ? { product: JSON.parse(JSON.stringify(finalContent.product)) }
          : finalContent?.type === 'product-list'
          ? { products: JSON.parse(JSON.stringify(finalContent.products)) }
          : null

        await supabase
          .from('messages')
          .insert({
            id: assistantMessageId,
            conversation_id: activeConversationId,
            role: 'assistant',
            content: messageContent,
            message_type: messageType,
            metadata: metadata ?? undefined,
          })

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Stream was aborted, not an error
          return
        }

        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        errorRef.current = errorMessage
        onError?.(errorMessage)
        console.error('Chat error:', error)
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [
      conversationId,
      n8nSessionId,
      router,
      addMessage,
      updateMessage,
      createConversation,
      setActiveConversation,
      setIsLoading,
      onError,
    ]
  )

  return {
    sendMessage,
    isLoading,
    error: errorRef.current,
    abortStream,
  }
}
