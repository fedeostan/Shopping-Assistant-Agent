import { create } from 'zustand'
import type { Conversation, Message, MessageContent } from '@/types/chat'

interface ChatStore {
  // State
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  sidebarOpen: boolean
  isLoading: boolean

  // Actions
  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, content: Partial<MessageContent>) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  createConversation: (conversation: Conversation) => void
  updateConversationTitle: (id: string, title: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  // Initial state
  conversations: [],
  activeConversationId: null,
  messages: [],
  sidebarOpen: true,
  isLoading: false,

  // Actions
  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: { ...msg.content, ...content } as MessageContent } : msg
      ),
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  createConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: conversation.id,
    })),

  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      ),
    })),
}))
