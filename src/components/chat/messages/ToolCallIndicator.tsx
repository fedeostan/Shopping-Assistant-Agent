'use client'

import { Loader2, Wrench, Check, Search, Database, Globe, ShoppingCart } from 'lucide-react'

interface ToolCallIndicatorProps {
  toolName: string
  status: 'running' | 'complete'
}

// Map tool names to user-friendly labels and icons
const toolConfig: Record<string, { label: string; icon: typeof Wrench }> = {
  'product_search': { label: 'Searching products', icon: Search },
  'fetch_product_details': { label: 'Fetching product details', icon: ShoppingCart },
  'search_inventory': { label: 'Checking inventory', icon: Database },
  'web_search': { label: 'Searching the web', icon: Globe },
}

export function ToolCallIndicator({ toolName, status }: ToolCallIndicatorProps) {
  const config = toolConfig[toolName] || { label: toolName, icon: Wrench }
  const Icon = config.icon
  const isRunning = status === 'running'

  return (
    <div
      className="inline-flex items-center gap-2 text-sm text-text-muted bg-surface-elevated rounded-lg px-3 py-2"
      role="status"
      aria-live="polite"
      aria-label={`${isRunning ? 'Running' : 'Completed'}: ${config.label}`}
    >
      {isRunning ? (
        <Loader2 className="w-4 h-4 animate-spin text-accent" aria-hidden="true" />
      ) : (
        <div className="relative">
          <Icon className="w-4 h-4 text-text-muted" aria-hidden="true" />
          <Check className="w-2.5 h-2.5 text-green-600 absolute -bottom-0.5 -right-0.5" aria-hidden="true" />
        </div>
      )}
      <span>
        {isRunning ? config.label : `${config.label} complete`}
      </span>
    </div>
  )
}
