'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { NavIndex } from '@/lib/nav-index'

const NavIndexCtx = createContext<NavIndex | null>(null)

/** Hands the server-built slim index (see lib/nav-index.ts) to client components. */
export function NavIndexProvider({ index, children }: { index: NavIndex; children: ReactNode }) {
  return <NavIndexCtx.Provider value={index}>{children}</NavIndexCtx.Provider>
}

export function useNavIndex(): NavIndex {
  const index = useContext(NavIndexCtx)
  if (!index) throw new Error('useNavIndex needs a NavIndexProvider')
  return index
}
