import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamChat } from '@/lib/n8n/client'
import type { N8nChatRequest } from '@/lib/n8n/types'

export const runtime = 'nodejs'
export const maxDuration = 100 // n8n Cloud timeout is 100 seconds

interface ChatRequestBody {
  sessionId: string
  message: string
  conversationId: string
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: ChatRequestBody = await request.json()
    const { sessionId, message, conversationId } = body

    if (!sessionId || !message || !conversationId) {
      return Response.json(
        { error: 'Missing required fields: sessionId, message, conversationId' },
        { status: 400 }
      )
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('n8n_session_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return Response.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare n8n request
    const n8nRequest: N8nChatRequest = {
      sessionId,
      message,
      userEmail: user.email || '',
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(n8nRequest)) {
            // Send each chunk as JSONL
            const line = JSON.stringify(chunk) + '\n'
            controller.enqueue(encoder.encode(line))

            // If we get an error chunk, we're done
            if (chunk.type === 'error') {
              break
            }
          }
        } catch (error) {
          // Send error as chunk
          const errorChunk = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Stream processing error',
          }
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
