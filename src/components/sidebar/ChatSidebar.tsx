'use client'

import { useRouter } from 'next/navigation'
import { PanelLeftClose, LogOut } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { NewChatButton } from './NewChatButton'
import { ConversationItem } from './ConversationItem'
import { createClient } from '@/lib/supabase/client'

export function ChatSidebar() {
  const router = useRouter()
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    toggleSidebar,
    setActiveConversation,
  } = useChatStore()

  const handleNewChat = () => {
    setActiveConversation(null)
    router.push('/chat')
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id)
    router.push(`/chat/${id}`)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!sidebarOpen) {
    return null
  }

  return (
    <aside
      className="w-60 h-full bg-surface border-r border-border flex flex-col"
      aria-label="Chat sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-header">Chats</h2>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <NewChatButton onClick={handleNewChat} />
      </div>

      {/* Conversation List */}
      <nav
        className="flex-1 overflow-y-auto px-2 pb-4"
        aria-label="Conversations"
      >
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            No conversations yet
          </p>
        ) : (
          <ul className="space-y-1" role="list">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <ConversationItem
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  onClick={() => handleSelectConversation(conversation.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-text-muted hover:text-text-body hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
