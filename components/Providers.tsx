'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'
import { ProgressProvider } from '@/lib/store'

/**
 * SessionProvider has to sit outside ProgressProvider, because the progress
 * store reads the session to decide whether to sync to an account.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </SessionProvider>
  )
}
