'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PanelLeftClose, LogOut, X } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { NewChatButton } from './NewChatButton'
import { ConversationItem } from './ConversationItem'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SidebarSkeleton } from '@/components/ui/Skeleton'

interface ChatSidebarProps {
  isLoading?: boolean
}

export function ChatSidebar({ isLoading = false }: ChatSidebarProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    setActiveConversation,
  } = useChatStore()

  // Close sidebar on mobile when route changes
  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id)
      router.push(`/chat/${id}`)
      // Close sidebar on mobile after selection
      if (isMobile) {
        setSidebarOpen(false)
      }
    },
    [setActiveConversation, router, isMobile, setSidebarOpen]
  )

  const handleNewChat = useCallback(() => {
    setActiveConversation(null)
    router.push('/chat')
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [setActiveConversation, router, isMobile, setSidebarOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, sidebarOpen, setSidebarOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile, sidebarOpen])

  if (!sidebarOpen) {
    return null
  }

  const sidebarContent = (
    <aside
      className={`
        h-full bg-surface flex flex-col
        ${isMobile
          ? 'w-[280px] max-w-[85vw] shadow-lg'
          : 'w-60 border-r border-border'
        }
      `}
      aria-label="Chat sidebar"
      role="navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-header">Chats</h2>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Close sidebar"
        >
          {isMobile ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
          )}
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
        {isLoading ? (
          <SidebarSkeleton />
        ) : conversations.length === 0 ? (
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

  // On mobile, render as overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 animate-in slide-in-from-left duration-200">
          {sidebarContent}
        </div>
      </>
    )
  }

  // On desktop, render inline
  return sidebarContent
}
