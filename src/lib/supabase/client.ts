import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton instance
let browserClient: SupabaseClient<Database> | null = null

/**
 * Returns the singleton Supabase browser client.
 * Creates the instance on first call, reuses it thereafter.
 *
 * IMPORTANT: This MUST be used for all client-side Supabase operations
 * to ensure a single WebSocket connection for Realtime features.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          // Enable Web Worker for background heartbeats
          // This prevents browser throttling when tab is in background
          worker: true,
        },
      }
    )

    // Set up auth state listener to sync token with Realtime WebSocket
    // This fixes 401 errors by ensuring Realtime always has a valid token
    browserClient.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        browserClient!.realtime.setAuth(session.access_token)
      }
    })

    // Set initial token if session already exists
    browserClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        browserClient!.realtime.setAuth(session.access_token)
      }
    })
  }
  return browserClient
}

/**
 * @deprecated Use getSupabaseClient() instead for singleton instance.
 * This function now returns the singleton for backward compatibility.
 */
export function createClient(): SupabaseClient<Database> {
  return getSupabaseClient()
}
