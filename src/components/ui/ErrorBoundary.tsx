'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
          role="alert"
        >
          <div className="w-16 h-16 mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-text-header mb-2">
            Something went wrong
          </h2>
          <p className="text-text-muted mb-6 max-w-md">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left w-full max-w-lg">
              <summary className="cursor-pointer text-sm text-text-muted hover:text-text-body">
                Error details
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-surface-elevated text-xs text-red-600 overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based alternative for more specific error handling
interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      <div className="w-12 h-12 mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-text-header mb-2">
        Error loading content
      </h3>
      <p className="text-sm text-text-muted mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  )
}
