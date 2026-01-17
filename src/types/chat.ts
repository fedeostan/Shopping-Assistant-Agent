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
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder'
  features?: string[]
  // Persona-specific enrichment fields
  originalPrice?: number // For DEAL_HUNTER - shows discount
  discountPercent?: number // For DEAL_HUNTER
  sustainabilityScore?: number // For ETHICAL_SHOPPER (1-5)
  sustainabilityBadges?: SustainabilityBadge[] // For ETHICAL_SHOPPER
  brandReputation?: BrandReputation // For BRAND_LOYALIST
  materialInfo?: MaterialInfo // For QUALITY_FOCUSED
  specs?: ProductSpec[] // For ANALYTICAL_BUYER
  impulseHooks?: string[] // For IMPULSE_SHOPPER - urgency triggers
}

// Sustainability badges for ethical shoppers
export type SustainabilityBadge =
  | 'organic'
  | 'fair-trade'
  | 'recycled'
  | 'carbon-neutral'
  | 'vegan'
  | 'cruelty-free'
  | 'locally-made'
  | 'eco-packaging'

// Brand reputation info for brand loyalists
export interface BrandReputation {
  score: number // 1-5
  yearsFounded?: number
  awards?: string[]
  certifications?: string[]
}

// Material/quality info for quality-focused buyers
export interface MaterialInfo {
  primary: string
  composition?: string[]
  durabilityRating?: number // 1-5
  careInstructions?: string
  warranty?: string
}

// Product specifications for analytical buyers
export interface ProductSpec {
  label: string
  value: string
  unit?: string
}

// Thinking step for progressive loading states
export type ThinkingStep = 'thinking' | 'searching' | 'analyzing' | 'generating'

// Discriminated union for message content types
export type MessageContent =
  | { type: 'text'; content: string }
  | { type: 'thinking'; step?: ThinkingStep }
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
