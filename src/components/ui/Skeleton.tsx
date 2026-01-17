'use client'

import { memo } from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton = memo(function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-border/50'

  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
})

// Pre-built skeleton patterns
export const MessageSkeleton = memo(function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="bg-surface rounded-2xl rounded-br-md p-4 shadow-sm">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
      </div>
    </div>
  )
})

export const ConversationSkeleton = memo(function ConversationSkeleton() {
  return (
    <div className="px-3 py-2.5 rounded-lg">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
})

export const SidebarSkeleton = memo(function SidebarSkeleton() {
  return (
    <div className="space-y-1" role="status" aria-label="Loading conversations">
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <span className="sr-only">Loading conversations</span>
    </div>
  )
})
