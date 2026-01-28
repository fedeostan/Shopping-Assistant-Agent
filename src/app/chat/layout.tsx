'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { ChatSidebar } from '@/components/sidebar/ChatSidebar'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Spinner } from '@/components/ui/Spinner'
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { Conversation } from '@/types/chat'

interface ChatLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, setConversations } = useChatStore()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Enable realtime sync for conversations
  useRealtimeConversations(userId)

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile, setSidebarOpen])

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setUserId(user.id)

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        const conversations: Conversation[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          n8nSessionId: row.n8n_session_id || '',
          createdAt: new Date(row.created_at || Date.now()),
          updatedAt: new Date(row.updated_at || Date.now()),
        }))
        setConversations(conversations)
      }
      setIsLoading(false)
    }

    loadConversations()
  }, [setConversations])

  // Show mobile header only when sidebar is closed on mobile
  // On desktop, sidebar is always visible (collapsed or expanded)
  const showMobileHeader = isMobile && !sidebarOpen

  return (
    <ErrorBoundary>
      <div className="h-screen flex overflow-hidden bg-background">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>

        {/* Sidebar - always visible on desktop (collapsed or expanded) */}
        <ChatSidebar isLoading={isLoading} />

        {/* Main content area */}
        <main id="main-content" className="flex-1 flex flex-col min-w-0">
          {/* Mobile header - only show when sidebar is closed on mobile */}
          {showMobileHeader && (
            <header className="shrink-0 h-14 px-4 flex items-center border-b border-border bg-surface">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <h1 className="ml-3 font-semibold text-text-header truncate">
                Shopping Assistant
              </h1>
            </header>
          )}

          {/* Chat content */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-3"
                role="status"
                aria-label="Loading chat"
              >
                <Spinner size="lg" />
                <p className="text-sm text-text-muted">Loading your conversations...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>

        {/* Toast notifications */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}
