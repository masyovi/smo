'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppView =
  | 'dashboard'
  | 'reports'
  | 'report-detail'
  | 'report-new'
  | 'locations'
  | 'categories'
  | 'users'
  | 'notes'
  | 'settings'
  | 'profile'

export type NavItem = 'dashboard' | 'reports' | 'locations' | 'categories' | 'users' | 'notes' | 'settings' | 'profile'

type SessionUser = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'
  phone: string | null
  department: string | null
}

interface AppState {
  // auth
  user: SessionUser | null
  authLoading: boolean
  setUser: (u: SessionUser | null) => void
  setAuthLoading: (b: boolean) => void
  logout: () => void

  // navigation (client-side view state since only `/` route is allowed)
  view: AppView
  activeReportId: string | null
  setView: (v: AppView) => void
  openReport: (id: string) => void
  openNewReport: () => void
  goDashboard: () => void

  // filters (persisted across view switches)
  statusFilter: string
  priorityFilter: string
  searchQuery: string
  setStatusFilter: (s: string) => void
  setPriorityFilter: (s: string) => void
  setSearchQuery: (s: string) => void
  resetFilters: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authLoading: true,
      setUser: (u) => set({ user: u }),
      setAuthLoading: (b) => set({ authLoading: b }),
      logout: () => set({ user: null, view: 'dashboard', activeReportId: null }),

      view: 'dashboard',
      activeReportId: null,
      setView: (v) => set({ view: v }),
      openReport: (id) => set({ view: 'report-detail', activeReportId: id }),
      openNewReport: () => set({ view: 'report-new' }),
      goDashboard: () => set({ view: 'dashboard', activeReportId: null }),

      statusFilter: 'ALL',
      priorityFilter: 'ALL',
      searchQuery: '',
      setStatusFilter: (s) => set({ statusFilter: s }),
      setPriorityFilter: (s) => set({ priorityFilter: s }),
      setSearchQuery: (s) => set({ searchQuery: s }),
      resetFilters: () =>
        set({ statusFilter: 'ALL', priorityFilter: 'ALL', searchQuery: '' }),
    }),
    {
      name: 'smo-app-store',
      partialize: (state) => ({
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
        view: state.view,
      }),
    }
  )
)

// Convenience selector: is the current user a read-only guest?
export const useIsGuest = () =>
  useAppStore((s) => s.user?.role === 'GUEST')

// Convenience selector: can the current user manage everything (TECH/ADMIN)?
// Useful for showing management UI to technicians only.
export const useCanManageAll = () => {
  const role = useAppStore((s) => s.user?.role)
  return role === 'TECHNICIAN' || role === 'ADMIN'
}
