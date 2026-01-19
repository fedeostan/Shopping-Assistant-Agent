'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { toast } from '@/stores/toast-store'
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseRealtimeSubscriptionOptions<TRow extends Record<string, unknown>> {
  /** Unique identifier for the subscription - MUST be non-empty or null to disable */
  subscriptionKey: string | null
  /** Channel name prefix */
  channelPrefix: string
  /** Table to subscribe to */
  table: string
  /** Filter column and value - value MUST be non-empty when subscriptionKey is set */
  filter: { column: string; value: string }
  /** Callback for handling changes - should be stable (useCallback with minimal deps) */
  onPayload: (payload: RealtimePostgresChangesPayload<TRow>) => void
  /** Optional callback to refetch data on reconnection */
  onReconnect?: () => Promise<void>
  /** Whether to show error toasts (default: true) */
  showErrorToast?: boolean
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number
}

interface UseRealtimeSubscriptionReturn {
  status: RealtimeStatus
  reconnect: () => void
  retryCount: number
}

/**
 * Async mutex implementation for safe concurrent access.
 * Prevents race conditions between setup and cleanup operations.
 */
class AsyncMutex {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true
      return
    }
    return new Promise((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      next()
    } else {
      this.locked = false
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

/**
 * Debounce utility for preventing rapid function calls.
 */
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T & { cancel: () => void }
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
  }
  return debounced
}

/**
 * Base hook for Supabase Realtime subscriptions with proper cleanup,
 * visibility handling, retry logic, and race condition prevention.
 *
 * Key features:
 * - Uses singleton Supabase client (single WebSocket connection)
 * - AsyncMutex prevents concurrent setup/cleanup race conditions
 * - Stable callback refs prevent dependency array explosion
 * - Synchronous subscribe callback prevents cleanup during execution
 * - Filter validation prevents malformed queries
 * - Debounced visibility changes prevent reconnection storms
 */
export function useRealtimeSubscription<TRow extends Record<string, unknown>>(
  options: UseRealtimeSubscriptionOptions<TRow>
): UseRealtimeSubscriptionReturn {
  const {
    subscriptionKey,
    channelPrefix,
    table,
    filter,
    showErrorToast = true,
    maxRetries = 3,
  } = options

  // Use refs for callbacks to avoid dependency changes triggering re-subscription
  const onPayloadRef = useRef(options.onPayload)
  const onReconnectRef = useRef(options.onReconnect)

  // Update refs when callbacks change (without triggering re-subscription)
  useEffect(() => {
    onPayloadRef.current = options.onPayload
  }, [options.onPayload])

  useEffect(() => {
    onReconnectRef.current = options.onReconnect
  }, [options.onReconnect])

  // Mutable refs for lifecycle management
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isUnmountedRef = useRef(false)
  const hasShownErrorRef = useRef(false)
  const isVisibleRef = useRef(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  )

  // Async mutex for safe concurrent operations
  const mutexRef = useRef(new AsyncMutex())

  // Singleton client reference
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null)

  // Status state
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')
  const [retryCountState, setRetryCountState] = useState(0)

  // Get singleton client (lazy initialization)
  const getClient = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient()
    }
    return supabaseRef.current
  }, [])

  // Safe cleanup that can be called from anywhere
  const cleanupChannel = useCallback(async () => {
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    const channel = channelRef.current
    if (channel) {
      channelRef.current = null
      try {
        const client = getClient()
        await client.removeChannel(channel)
      } catch (err) {
        // Channel may already be removed - this is fine
        console.debug('Realtime: Channel removal (may be expected):', err)
      }
    }
  }, [getClient])

  // Schedule retry with exponential backoff (called from synchronous context)
  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      if (showErrorToast && !hasShownErrorRef.current) {
        hasShownErrorRef.current = true
        toast.error('Failed to connect to realtime updates. Please refresh the page.')
      }
      return
    }

    retryCountRef.current++
    setRetryCountState(retryCountRef.current)

    // Cap at 10 seconds
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000)
    console.log(
      `Realtime: Scheduling retry ${retryCountRef.current}/${maxRetries} ` +
        `for ${channelPrefix} in ${delay}ms`
    )

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null
      if (!isUnmountedRef.current && isVisibleRef.current) {
        // Use mutex for the retry setup
        mutexRef.current
          .withLock(async () => {
            await cleanupChannel()
            await setupSubscriptionInternal()
          })
          .catch((err) => {
            console.error(`Realtime: Retry setup failed for ${channelPrefix}:`, err)
          })
      }
    }, delay)
  }, [maxRetries, showErrorToast, channelPrefix, cleanupChannel])

  // Core subscription setup - ONLY called with mutex held
  const setupSubscriptionInternal = useCallback(async (): Promise<void> => {
    // Pre-flight checks
    if (isUnmountedRef.current) {
      console.debug(`Realtime: Skipping setup - component unmounted`)
      return
    }

    if (!isVisibleRef.current) {
      console.debug(`Realtime: Skipping setup - tab not visible`)
      return
    }

    if (!subscriptionKey) {
      console.debug(`Realtime: Skipping setup - no subscription key`)
      return
    }

    // CRITICAL: Validate filter value is not empty
    if (!filter.value || filter.value.trim() === '') {
      console.warn(
        `Realtime: Skipping setup - empty filter value for ${channelPrefix}. ` +
          `This would create an invalid filter '${filter.column}=eq.'`
      )
      setStatus('error')
      return
    }

    // Verify auth session and set Realtime auth token
    const client = getClient()
    const {
      data: { session },
    } = await client.auth.getSession()

    if (!session) {
      console.warn(`Realtime: No auth session, skipping ${channelPrefix} subscription`)
      setStatus('error')
      return
    }

    // CRITICAL: Set auth token for Realtime BEFORE subscribing to channels
    // This prevents 401 errors on WebSocket connections
    if (session.access_token) {
      client.realtime.setAuth(session.access_token)
    }

    // Check after async operation
    if (isUnmountedRef.current || !isVisibleRef.current) {
      return
    }

    setStatus('connecting')
    const channelName = `${channelPrefix}:${subscriptionKey}`

    // Check for duplicate channel and remove it
    const existingChannel = client
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`)
    if (existingChannel) {
      console.debug(`Realtime: Removing duplicate channel ${channelName}`)
      await client.removeChannel(existingChannel)
      // Small delay to ensure Phoenix socket cleanup
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Final check before creating channel
    if (isUnmountedRef.current || !isVisibleRef.current) {
      return
    }

    // Create channel with SYNCHRONOUS callback
    // CRITICAL: The subscribe callback must NOT be async to prevent
    // race conditions with cleanup
    const channel = client
      .channel(channelName)
      .on<TRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => {
          // Use ref to always get latest callback
          if (!isUnmountedRef.current) {
            onPayloadRef.current(payload)
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        // SYNCHRONOUS callback - no async operations here!
        // This prevents cleanup race conditions

        if (isUnmountedRef.current) return

        switch (subscriptionStatus) {
          case 'SUBSCRIBED':
            console.log(`Realtime: Subscribed to ${channelPrefix}`)
            setStatus('connected')
            hasShownErrorRef.current = false
            retryCountRef.current = 0
            setRetryCountState(0)

            // Schedule reconnect callback (fire and forget)
            if (onReconnectRef.current) {
              Promise.resolve(onReconnectRef.current()).catch((err) => {
                console.error(`Realtime: Error in onReconnect for ${channelPrefix}:`, err)
              })
            }
            break

          case 'CHANNEL_ERROR':
            console.error(`Realtime: Channel error for ${channelPrefix}`)
            setStatus('error')
            // Schedule retry (fire and forget - synchronous function)
            scheduleRetry()
            break

          case 'CLOSED':
            setStatus('disconnected')
            break

          case 'TIMED_OUT':
            console.warn(`Realtime: Subscription timed out for ${channelPrefix}`)
            setStatus('error')
            scheduleRetry()
            break
        }
      })

    channelRef.current = channel
  }, [subscriptionKey, channelPrefix, table, filter, getClient, scheduleRetry])

  // Create debounced reconnect function
  const reconnectDebouncedRef = useRef<ReturnType<typeof debounce> | null>(null)

  // Initialize debounced reconnect
  useEffect(() => {
    reconnectDebouncedRef.current = debounce(() => {
      retryCountRef.current = 0
      setRetryCountState(0)
      hasShownErrorRef.current = false

      mutexRef.current
        .withLock(async () => {
          await cleanupChannel()
          await setupSubscriptionInternal()
        })
        .catch((err) => {
          console.error(`Realtime: Reconnect failed for ${channelPrefix}:`, err)
        })
    }, 300)

    return () => {
      reconnectDebouncedRef.current?.cancel()
    }
  }, [cleanupChannel, setupSubscriptionInternal, channelPrefix])

  // Public reconnect function
  const reconnect = useCallback(() => {
    reconnectDebouncedRef.current?.()
  }, [])

  // Visibility change handler (debounced)
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = debounce(() => {
      const isVisible = document.visibilityState === 'visible'
      const wasHidden = !isVisibleRef.current
      isVisibleRef.current = isVisible

      if (isVisible && wasHidden && subscriptionKey) {
        console.log(`Realtime: Tab visible, reconnecting ${channelPrefix}`)
        retryCountRef.current = 0
        setRetryCountState(0)
        reconnect()
      } else if (!isVisible && subscriptionKey) {
        console.log(`Realtime: Tab hidden, pausing ${channelPrefix}`)
        mutexRef.current
          .withLock(async () => {
            await cleanupChannel()
            setStatus('disconnected')
          })
          .catch(console.error)
      }
    }, 200) // Debounce visibility changes by 200ms

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      handleVisibilityChange.cancel()
    }
  }, [subscriptionKey, channelPrefix, cleanupChannel, reconnect])

  // Main subscription effect - minimal dependencies!
  useEffect(() => {
    // Reset state on subscription key change
    isUnmountedRef.current = false
    hasShownErrorRef.current = false
    retryCountRef.current = 0
    setRetryCountState(0)

    if (!subscriptionKey) {
      setStatus('disconnected')
      return
    }

    // Validate filter before attempting subscription
    if (!filter.value || filter.value.trim() === '') {
      console.warn(`Realtime: Cannot subscribe with empty filter value for ${channelPrefix}`)
      setStatus('error')
      return
    }

    // Setup with mutex
    mutexRef.current.withLock(setupSubscriptionInternal).catch((err) => {
      console.error(`Realtime: Initial setup failed for ${channelPrefix}:`, err)
    })

    // Cleanup on unmount or key change
    return () => {
      isUnmountedRef.current = true

      // Cancel any pending operations
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      reconnectDebouncedRef.current?.cancel()

      // Cleanup channel (fire and forget on unmount)
      cleanupChannel().catch(console.error)
    }
  }, [subscriptionKey, channelPrefix, table, filter.column, filter.value, setupSubscriptionInternal, cleanupChannel])

  return {
    status,
    reconnect,
    retryCount: retryCountState,
  }
}
