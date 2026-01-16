'use client'

import { Plus } from 'lucide-react'

interface NewChatButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function NewChatButton({ onClick, disabled }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-body font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      aria-label="Start a new conversation"
    >
      <Plus className="w-5 h-5 text-accent-decorative" aria-hidden="true" />
      <span>New chat</span>
    </button>
  )
}
