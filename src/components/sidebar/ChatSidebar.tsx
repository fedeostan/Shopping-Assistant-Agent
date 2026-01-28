'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PanelLeftClose, PanelLeftOpen, LogOut, X, Plus } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { toast } from '@/stores/toast-store'
import { NewChatButton } from './NewChatButton'
import { ConversationItem } from './ConversationItem'
import { getSupabaseClient } from '@/lib/supabase/client'
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
    deleteConversation,
    createConversation,
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

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      // Store conversation for potential rollback
      const conversation = conversations.find((c) => c.id === conversationId)
      if (!conversation) return

      // Optimistic delete
      deleteConversation(conversationId)

      // Navigate away if this was the active conversation
      if (activeConversationId === conversationId) {
        router.push('/chat')
      }

      // Close sidebar on mobile after deletion
      if (isMobile) {
        setSidebarOpen(false)
      }

      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          // Rollback on error
          createConversation(conversation)
          if (activeConversationId === conversationId) {
            setActiveConversation(conversationId)
          }
          toast.error('Failed to delete conversation')
        } else {
          toast.success('Conversation deleted')
        }
      } catch {
        // Rollback on network error
        createConversation(conversation)
        if (activeConversationId === conversationId) {
          setActiveConversation(conversationId)
        }
        toast.error('Failed to delete conversation')
      }
    },
    [
      conversations,
      activeConversationId,
      deleteConversation,
      createConversation,
      setActiveConversation,
      router,
      isMobile,
      setSidebarOpen,
    ]
  )

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
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

  // Mobile sidebar - overlay behavior
  if (isMobile) {
    if (!sidebarOpen) {
      return null
    }
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
          <aside
            className="h-full bg-surface flex flex-col w-[280px] max-w-[85vw] shadow-lg"
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
                <X className="w-5 h-5" aria-hidden="true" />
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
                        onDelete={() => handleDeleteConversation(conversation.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </nav>

            {/* Footer with App Icon and Logout */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-elevated shrink-0">
                  <Image
                    src="/icon.png"
                    alt="Shopping Assistant"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-body hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium">Sign out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </>
    )
  }

  // Desktop sidebar - collapsible with smooth transitions
  return (
    <aside
      className={`
        h-full bg-surface flex flex-col border-r border-border
        transition-all duration-200 ease-out overflow-hidden
        ${sidebarOpen ? 'w-60' : 'w-[60px]'}
      `}
      aria-label={sidebarOpen ? 'Chat sidebar' : 'Chat sidebar (collapsed)'}
      role="navigation"
    >
      {/* Header / Toggle area */}
      <div className={`
        flex items-center border-b border-border
        transition-all duration-200
        ${sidebarOpen ? 'justify-between px-4 py-4' : 'justify-center py-4'}
      `}>
        {sidebarOpen && (
          <h2 className="text-lg font-semibold text-text-header whitespace-nowrap">
            Chats
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className={`
        transition-all duration-200
        ${sidebarOpen ? 'p-4' : 'flex items-center justify-center py-2'}
      `}>
        {sidebarOpen ? (
          <NewChatButton onClick={handleNewChat} />
        ) : (
          <button
            onClick={handleNewChat}
            className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Conversation List - only show when expanded */}
      {sidebarOpen && (
        <nav
          className="flex-1 overflow-y-auto px-2 pb-4"
          aria-label="Conversations"
        >
          {isLoading ? (
            <SidebarSkeleton />
          ) : conversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted whitespace-nowrap">
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
                    onDelete={() => handleDeleteConversation(conversation.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}

      {/* Spacer when collapsed */}
      {!sidebarOpen && <div className="flex-1" />}

      {/* Footer */}
      <div className={`
        border-t border-border
        transition-all duration-200
        ${sidebarOpen ? 'p-4' : 'flex items-center justify-center py-4'}
      `}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-elevated shrink-0">
              <Image
                src="/icon.png"
                alt="Shopping Assistant"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-body hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-elevated">
            <Image
              src="/icon.png"
              alt="Shopping Assistant"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </aside>
  )
}
