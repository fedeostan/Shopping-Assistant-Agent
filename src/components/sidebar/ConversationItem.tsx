'use client'

import { memo } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { Conversation } from '@/types/chat'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: ConversationItemProps) {
  const displayTitle = conversation.title || 'New conversation'
  const formattedDate = formatRelativeDate(conversation.updatedAt)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
        isActive
          ? 'bg-accent-light text-accent'
          : 'hover:bg-surface-elevated text-text-body'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`${displayTitle}, ${formattedDate}`}
    >
      <MessageSquare
        className={`w-5 h-5 mt-0.5 shrink-0 ${
          isActive ? 'text-accent' : 'text-text-muted'
        }`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayTitle}</p>
        <p className="text-xs text-text-muted mt-0.5">{formattedDate}</p>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted hover:text-red-600 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
          aria-label={`Delete conversation: ${displayTitle}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
}
