import { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { SchedulerInit } from '@/components/dashboard/scheduler-init'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Initialize scheduler for scheduled workflows */}
      <SchedulerInit />

      {/* Sidebar Wrapper - Desktop only, fixed width handled by component or flex */}
      <aside className="hidden md:flex flex-col z-30 h-full border-r border-border/50 bg-card/50 backdrop-blur-xl">
        <Sidebar />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Wrapper - Sticky top with glass effect */}
        <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <Header />
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
