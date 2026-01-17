'use client'

import { memo } from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
}

export const Spinner = memo(function Spinner({
  size = 'md',
  className = '',
  label = 'Loading',
}: SpinnerProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <div
        className={`${sizeClasses[size]} border-accent/20 border-t-accent rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
})
