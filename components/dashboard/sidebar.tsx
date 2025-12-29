// components/dashboard/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Workflow,
  Plug,
  Calendar,
  FileText,
  UserCheck,
  Settings,
  Zap,
  Upload,
  LayoutTemplate
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  mobile?: boolean
}


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
  { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
  { name: 'Integrations', href: '/dashboard/integration', icon: Plug },
  { name: 'Import Data', href: '/dashboard/import', icon: Upload },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
  { name: 'Attendance', href: '/dashboard/attendance', icon: UserCheck },
  { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ mobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex flex-col h-full bg-card text-card-foreground",
      mobile ? "w-full" : "w-64 border-r border-border/50"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">EduFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer / Pro Plan Active Card */}
      <div className="p-4 border-t border-border/50">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-background rounded-lg shadow-sm">
              <Zap className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Pro Plan</p>
              <p className="text-xs text-muted-foreground">Working properly</p>
            </div>
          </div>
          <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700" variant="default" disabled>
            ✓ Active
          </Button>
        </div>
      </div>
    </div>
  )
}