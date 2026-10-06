'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/app/sidebar'
import { Topbar } from '@/components/app/topbar'
import { MobileNavWithDrawer } from '@/components/app/mobile-nav'
import { DashboardView } from '@/components/app/views/dashboard-view'
import { ReportsView } from '@/components/app/views/reports-view'
import { ReportDetailView } from '@/components/app/views/report-detail-view'
import { ReportFormView } from '@/components/app/views/report-form-view'
import { LocationsView } from '@/components/app/views/locations-view'
import { CategoriesView } from '@/components/app/views/categories-view'
import { UsersView } from '@/components/app/views/users-view'
import { ProfileView } from '@/components/app/views/profile-view'
import { cn } from '@/lib/utils'

export function AppShell() {
  const view = useAppStore((s) => s.view)

  return (
    <div className="bg-background flex min-h-screen w-full flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:pb-8 lg:pt-6">
            <div className="scrollbar-thin mx-auto w-full max-w-7xl">
              <ViewRouter view={view} />
            </div>
          </main>
        </div>
      </div>
      <MobileNavWithDrawer />
    </div>
  )
}

function ViewRouter({ view }: { view: string }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />
    case 'reports':
      return <ReportsView />
    case 'report-detail':
      return <ReportDetailView />
    case 'report-new':
      return <ReportFormView />
    case 'locations':
      return <LocationsView />
    case 'categories':
      return <CategoriesView />
    case 'users':
      return <UsersView />
    case 'profile':
      return <ProfileView />
    default:
      return <DashboardView />
  }
}
