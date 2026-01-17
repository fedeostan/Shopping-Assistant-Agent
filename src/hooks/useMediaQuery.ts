'use client'

import { useSyncExternalStore, useCallback } from 'react'

// For server-side rendering safety
function getServerSnapshot(): boolean {
  return false
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', callback)
      return () => mediaQuery.removeEventListener('change', callback)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// Common breakpoints based on Tailwind defaults
export function useIsMobile(): boolean {
  const isNotMobile = useMediaQuery('(min-width: 768px)')
  return !isNotMobile
}

export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery('(min-width: 768px)')
  const isAboveTablet = useMediaQuery('(min-width: 1024px)')
  return isAboveMobile && !isAboveTablet
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
