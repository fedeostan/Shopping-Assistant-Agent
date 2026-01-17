'use client'

import type { MessageContent, PersonaType, ThinkingStep } from '@/types/chat'
import { TextMessage } from './TextMessage'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ToolCallIndicator } from './ToolCallIndicator'
import { ProductCard } from './ProductCard'
import { ProductList } from './ProductList'

interface MessageContentRendererProps {
  content: MessageContent
  isUser?: boolean
  persona?: PersonaType
}

/**
 * Message Component Registry
 *
 * Routes message content types to their appropriate rendering components.
 * Uses discriminated unions for type-safe rendering.
 *
 * Supported content types:
 * - text: Plain text messages
 * - thinking: Loading/processing indicator with optional step
 * - tool-call: Tool execution status
 * - product: Single product card
 * - product-list: Multiple products with view modes
 */
export function MessageContentRenderer({
  content,
  isUser = false,
  persona,
}: MessageContentRendererProps) {
  switch (content.type) {
    case 'text':
      return <TextMessage content={content.content} isUser={isUser} />

    case 'thinking':
      return <ThinkingIndicator step={content.step as ThinkingStep} />

    case 'tool-call':
      return <ToolCallIndicator toolName={content.toolName} status={content.status} />

    case 'product':
      return <ProductCard product={content.product} persona={persona} />

    case 'product-list':
      return <ProductList products={content.products} persona={persona} />

    default: {
      // TypeScript exhaustiveness check - should never reach here
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = content
      return null
    }
  }
}
