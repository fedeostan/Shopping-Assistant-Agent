'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { ChatSidebar } from '@/components/sidebar/ChatSidebar'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/types/chat'

interface ChatLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { sidebarOpen, toggleSidebar, setConversations } = useChatStore()
  const [isLoading, setIsLoading] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

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

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header with toggle when sidebar is closed */}
        {!sidebarOpen && (
          <header className="shrink-0 h-14 px-4 flex items-center border-b border-border bg-surface">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <h1 className="ml-3 font-semibold text-text-header">
              Shopping Assistant
            </h1>
          </header>
        )}

        {/* Chat content */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-muted">Loading...</div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  )
}
