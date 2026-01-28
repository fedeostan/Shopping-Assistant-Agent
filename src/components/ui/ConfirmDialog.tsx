'use client'

import { useEffect, useRef, useCallback, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Store previously focused element and focus cancel button when opened
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 0)
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus()
    }
  }, [open])

  // Trap focus within dialog
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (!open) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const firstFocusable = focusable[0]
        const lastFocusable = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    },
    [open, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])

  const handleConfirmClick = () => {
    onConfirm()
  }

  const handleButtonKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  if (!open) return null

  const confirmButtonClasses =
    confirmVariant === 'destructive'
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-accent text-white hover:bg-accent-hover focus:ring-accent'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-md mx-4 p-6 bg-surface rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-text-header"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm text-text-body"
        >
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            onKeyDown={(e) => handleButtonKeyDown(e, onClose)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-body hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            onKeyDown={(e) => handleButtonKeyDown(e, handleConfirmClick)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
