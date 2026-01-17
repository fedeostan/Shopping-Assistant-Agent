'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { useChat } from '@/hooks/useChat'

export default function NewChatPage() {
  const { sendMessage, error } = useChat({
    onError: (err) => console.error('Chat error:', err),
  })

  return (
    <>
      <ChatInterface onSendMessage={sendMessage} />
      {error && (
        <div
          role="alert"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-700 px-4 py-2 rounded-lg shadow-md text-sm"
        >
          {error}
        </div>
      )}
    </>
  )
}
