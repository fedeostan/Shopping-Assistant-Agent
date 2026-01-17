import { create } from 'zustand'
import type { Conversation, Message, MessageContent } from '@/types/chat'

// Track pending optimistic updates for rollback
interface PendingUpdate {
  id: string
  type: 'message' | 'conversation'
  previousState: Message | Conversation | null
}

interface ChatStore {
  // State
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  sidebarOpen: boolean
  isLoading: boolean
  error: string | null
  pendingUpdates: Map<string, PendingUpdate>

  // Actions
  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, content: Partial<MessageContent>) => void
  removeMessage: (id: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  createConversation: (conversation: Conversation) => void
  updateConversationTitle: (id: string, title: string) => void
  deleteConversation: (id: string) => void

  // Optimistic update helpers
  addPendingUpdate: (update: PendingUpdate) => void
  removePendingUpdate: (id: string) => void
  rollbackUpdate: (id: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  activeConversationId: null,
  messages: [],
  sidebarOpen: true,
  isLoading: false,
  error: null,
  pendingUpdates: new Map(),

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

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

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

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  // Optimistic update helpers
  addPendingUpdate: (update) => {
    const { pendingUpdates } = get()
    const newPending = new Map(pendingUpdates)
    newPending.set(update.id, update)
    set({ pendingUpdates: newPending })
  },

  removePendingUpdate: (id) => {
    const { pendingUpdates } = get()
    const newPending = new Map(pendingUpdates)
    newPending.delete(id)
    set({ pendingUpdates: newPending })
  },

  rollbackUpdate: (id) => {
    const { pendingUpdates, messages, conversations } = get()
    const update = pendingUpdates.get(id)

    if (!update) return

    if (update.type === 'message') {
      if (update.previousState === null) {
        // Was an add, so remove it
        set({
          messages: messages.filter((m) => m.id !== id),
        })
      } else {
        // Was an update, restore previous state
        set({
          messages: messages.map((m) =>
            m.id === id ? (update.previousState as Message) : m
          ),
        })
      }
    } else if (update.type === 'conversation') {
      if (update.previousState === null) {
        // Was an add, so remove it
        set({
          conversations: conversations.filter((c) => c.id !== id),
        })
      } else {
        // Was an update, restore previous state
        set({
          conversations: conversations.map((c) =>
            c.id === id ? (update.previousState as Conversation) : c
          ),
        })
      }
    }

    // Remove from pending
    const newPending = new Map(pendingUpdates)
    newPending.delete(id)
    set({ pendingUpdates: newPending })
  },
}))
