'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  triggerClassName?: string
  'aria-label'?: string
}

export function DropdownMenu({
  trigger,
  children,
  align = 'right',
  triggerClassName = '',
  'aria-label': ariaLabel,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 160

    setPosition({
      top: rect.bottom + 4,
      left: align === 'right' ? rect.right - menuWidth : rect.left,
    })
  }, [align])

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen((prev) => !prev)
  }, [isOpen, updatePosition])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleClose])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLElement>(
        '[role="menuitem"]'
      )
      firstItem?.focus()
    }
  }, [isOpen])

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed min-w-[160px] py-1 bg-surface rounded-lg border border-border shadow-sm z-50 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.top, left: position.left }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

interface DropdownMenuItemProps {
  onClick: () => void
  icon?: ReactNode
  children: ReactNode
  variant?: 'default' | 'destructive'
}

export function DropdownMenuItem({
  onClick,
  icon,
  children,
  variant = 'default',
}: DropdownMenuItemProps) {
  const handleClick = () => {
    onClick()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const baseClasses =
    'w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors focus:outline-none'
  const variantClasses =
    variant === 'destructive'
      ? 'text-text-body hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600'
      : 'text-text-body hover:bg-surface-elevated focus:bg-surface-elevated'

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${variantClasses}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}
