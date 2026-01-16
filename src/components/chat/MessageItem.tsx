'use client'

import { User, Bot, Loader2, Wrench, ExternalLink } from 'lucide-react'
import type { Message, UCPProductItem } from '@/types/chat'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent" aria-hidden="true" />
        </div>
      )}
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-surface rounded-2xl rounded-br-md px-4 py-3 shadow-sm'
            : ''
        }`}
      >
        <MessageContent content={message.content} isUser={isUser} />
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <User className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

function MessageContent({
  content,
  isUser,
}: {
  content: Message['content']
  isUser: boolean
}) {
  switch (content.type) {
    case 'text':
      return (
        <p className={`text-sm leading-relaxed ${isUser ? 'text-text-body' : 'text-text-body'}`}>
          {content.content}
        </p>
      )

    case 'thinking':
      return (
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="text-sm">Thinking...</span>
        </div>
      )

    case 'tool-call':
      return (
        <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-elevated rounded-lg px-3 py-2">
          {content.status === 'running' ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Wrench className="w-4 h-4" aria-hidden="true" />
          )}
          <span>
            {content.status === 'running' ? 'Using' : 'Used'} {content.toolName}
          </span>
        </div>
      )

    case 'product':
      return <ProductCard product={content.product} />

    case 'product-list':
      return (
        <div className="space-y-3">
          {content.products.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      )

    default:
      return null
  }
}

function ProductCard({ product }: { product: UCPProductItem }) {
  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
      {product.imageUrl && (
        <div className="aspect-video bg-surface-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-medium text-text-header line-clamp-2">
              {product.name}
            </h4>
            {product.brand && (
              <p className="text-sm text-text-muted">{product.brand}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-accent">
              {product.currency}
              {product.price.toFixed(2)}
            </p>
          </div>
        </div>
        {product.description && (
          <p className="text-sm text-text-body line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        {product.rating !== undefined && (
          <div className="flex items-center gap-1 text-sm text-text-muted mb-3">
            <span className="text-accent-decorative">★</span>
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span>({product.reviewCount} reviews)</span>
            )}
          </div>
        )}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View Product
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
