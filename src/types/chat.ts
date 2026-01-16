// UCP Product Item from n8n workflow
export interface UCPProductItem {
  name: string
  brand: string
  price: number
  currency: string
  url: string
  imageUrl?: string
  description?: string
  rating?: number
  reviewCount?: number
  availability?: string
  features?: string[]
}

// Discriminated union for message content types
export type MessageContent =
  | { type: 'text'; content: string }
  | { type: 'thinking' }
  | { type: 'product'; product: UCPProductItem }
  | { type: 'product-list'; products: UCPProductItem[] }
  | { type: 'tool-call'; toolName: string; status: 'running' | 'complete' }

// Message interface for UI
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: MessageContent
  createdAt: Date
}

// Conversation interface for UI
export interface Conversation {
  id: string
  title: string | null
  n8nSessionId: string
  createdAt: Date
  updatedAt: Date
}

// User persona types from n8n workflow
export type PersonaType =
  | 'IMPULSE_SHOPPER'
  | 'ANALYTICAL_BUYER'
  | 'DEAL_HUNTER'
  | 'BRAND_LOYALIST'
  | 'ETHICAL_SHOPPER'
  | 'QUALITY_FOCUSED'

// User state from n8n workflow
export type UserState = 'NEW' | 'ONBOARDING' | 'PROFILED'
