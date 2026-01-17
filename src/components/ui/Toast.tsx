'use client'

import { memo, useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastStore, type ToastType } from '@/stores/toast-store'

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
  error: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
  warning: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
  info: <Info className="w-5 h-5" aria-hidden="true" />,
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

interface ToastItemProps {
  id: string
  type: ToastType
  message: string
  onClose: (id: string) => void
}

const ToastItem = memo(function ToastItem({ id, type, message, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 150)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-md
        transition-all duration-150 ease-out
        ${typeStyles[type]}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
      `}
    >
      <span className={iconStyles[type]}>{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
})

export const ToastContainer = memo(function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  )
})
