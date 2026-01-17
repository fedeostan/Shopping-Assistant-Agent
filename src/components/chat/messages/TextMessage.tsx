'use client'

interface TextMessageProps {
  content: string
  isUser?: boolean
}

export function TextMessage({ content, isUser = false }: TextMessageProps) {
  return (
    <div className={`text-sm leading-relaxed ${isUser ? 'text-text-body' : 'text-text-body'}`}>
      {/* Simple text rendering - can be enhanced with markdown support later */}
      {content.split('\n').map((line, index, array) => (
        <span key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </span>
      ))}
    </div>
  )
}
