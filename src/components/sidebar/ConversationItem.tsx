'use client'

import { memo, useState } from 'react'
import { MessageSquare, MoreVertical, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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
  const [showConfirm, setShowConfirm] = useState(false)
  const displayTitle = conversation.title || 'New conversation'
  const formattedDate = formatRelativeDate(conversation.updatedAt)

  const handleDeleteClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowConfirm(false)
    onDelete?.()
  }

  return (
    <>
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
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset ${
          isActive
            ? 'bg-accent-light text-accent'
            : 'hover:bg-surface-elevated text-text-body'
        }`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={`${displayTitle}, ${formattedDate}`}
      >
        <MessageSquare
          className={`w-5 h-5 shrink-0 ${
            isActive ? 'text-accent' : 'text-text-muted'
          }`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayTitle}</p>
          <p className="text-xs text-text-muted mt-0.5">{formattedDate}</p>
        </div>
        {onDelete && (
          <div
            className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu
              trigger={<MoreVertical className="w-4 h-4" aria-hidden="true" />}
              triggerClassName="p-1.5 rounded-md hover:bg-white/50 text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={`Options for ${displayTitle}`}
            >
              <DropdownMenuItem
                onClick={handleDeleteClick}
                icon={<Trash2 className="w-4 h-4" />}
                variant="destructive"
              >
                Delete chat
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete conversation?"
        description="This will permanently delete this conversation and all its messages. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
      />
    </>
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
