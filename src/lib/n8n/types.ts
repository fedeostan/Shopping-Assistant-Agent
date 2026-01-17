import type { UCPProductItem } from '@/types/chat'

// n8n webhook request payload
export interface N8nChatRequest {
  sessionId: string
  message: string
  userEmail: string
}

// JSONL chunk types from n8n streaming response
export type N8nChunkType =
  | 'begin'
  | 'item'
  | 'tool-call-start'
  | 'tool-call-end'
  | 'end'
  | 'error'

// Base chunk structure
interface N8nBaseChunk {
  type: N8nChunkType
}

// Begin chunk - signals start of response
export interface N8nBeginChunk extends N8nBaseChunk {
  type: 'begin'
}

// Item chunk - contains text content
export interface N8nItemChunk extends N8nBaseChunk {
  type: 'item'
  content: string
}

// Tool call start chunk
export interface N8nToolCallStartChunk extends N8nBaseChunk {
  type: 'tool-call-start'
  toolName: string
  toolCallId: string
}

// Tool call end chunk - may contain product data
export interface N8nToolCallEndChunk extends N8nBaseChunk {
  type: 'tool-call-end'
  toolCallId: string
  result?: N8nToolCallResult
}

// Tool call result types
export type N8nToolCallResult =
  | { type: 'product'; product: UCPProductItem }
  | { type: 'product-list'; products: UCPProductItem[] }
  | { type: 'text'; content: string }

// End chunk - signals end of response
export interface N8nEndChunk extends N8nBaseChunk {
  type: 'end'
  totalTokens?: number
}

// Error chunk
export interface N8nErrorChunk extends N8nBaseChunk {
  type: 'error'
  message: string
  code?: string
}

// Union of all chunk types
export type N8nStreamChunk =
  | N8nBeginChunk
  | N8nItemChunk
  | N8nToolCallStartChunk
  | N8nToolCallEndChunk
  | N8nEndChunk
  | N8nErrorChunk

// Parsed streaming state
export interface StreamingState {
  isStreaming: boolean
  text: string
  toolCalls: Map<string, { toolName: string; status: 'running' | 'complete'; result?: N8nToolCallResult }>
  error: string | null
}

// Configuration for n8n client
export interface N8nClientConfig {
  webhookUrl: string
  timeout?: number // in milliseconds
  maxRetries?: number
}
