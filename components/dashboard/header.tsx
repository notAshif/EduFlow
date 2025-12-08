// components/dashboard/header.tsx
'use client'

import { Bell, Search, HelpCircle, Menu, X, FileText, Users, Calendar, Settings, Workflow, BookOpen, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/dashboard/sidebar'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotificationStore } from '@/lib/stores/notification-store'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'page' | 'workflow' | 'student' | 'assignment' | 'help'
  href: string
  icon: React.ReactNode
}

const searchableItems: SearchResult[] = [
  // Pages
  { id: 'dashboard', title: 'Dashboard', description: 'View your dashboard overview', type: 'page', href: '/dashboard', icon: <FileText className="w-4 h-4" /> },
  { id: 'workflows', title: 'Workflows', description: 'Manage your automation workflows', type: 'page', href: '/dashboard/workflows', icon: <Workflow className="w-4 h-4" /> },
  { id: 'attendance', title: 'Attendance', description: 'Track student attendance', type: 'page', href: '/dashboard/attendance', icon: <Users className="w-4 h-4" /> },
  { id: 'assignments', title: 'Assignments', description: 'Manage class assignments', type: 'page', href: '/dashboard/assignments', icon: <FileText className="w-4 h-4" /> },
  { id: 'schedule', title: 'Schedule', description: 'View class schedule', type: 'page', href: '/dashboard/schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'integration', title: 'Integrations', description: 'Connect external tools', type: 'page', href: '/dashboard/integration', icon: <Settings className="w-4 h-4" /> },
  { id: 'settings', title: 'Settings', description: 'Manage your settings', type: 'page', href: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'notifications', title: 'Notifications', description: 'View all notifications', type: 'page', href: '/dashboard/notifications', icon: <Bell className="w-4 h-4" /> },
  // Help topics
  { id: 'help-workflows', title: 'How to create workflows', description: 'Learn to automate tasks', type: 'help', href: '/docs#quick-start', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'help-attendance', title: 'Attendance tracking guide', description: 'Set up attendance automation', type: 'help', href: '/docs#attendance', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'help-integrations', title: 'Integration setup guide', description: 'Connect WhatsApp, Gmail, etc.', type: 'help', href: '/docs#integrations', icon: <BookOpen className="w-4 h-4" /> },
]

const helpTopics = [
  { title: 'Getting Started', description: 'Learn the basics of EduFlow', href: '/docs' },
  { title: 'Creating Workflows', description: 'Automate your daily tasks', href: '/docs#workflows' },
  { title: 'Setting up Integrations', description: 'Connect WhatsApp, Gmail & more', href: '/docs#integrations' },
  { title: 'Attendance Tracking', description: 'Automate attendance alerts', href: '/docs#attendance' },
  { title: 'API Documentation', description: 'For developers', href: '/api-reference' },
  { title: 'Contact Support', description: 'Get help from our team', href: '/support' },
]

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Use the notification store
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    unreadCount
  } = useNotificationStore()

  const unread = unreadCount()

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [fetchNotifications])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchableItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [searchQuery])

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
        setIsSearchFocused(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.getElementById('global-search')
        searchInput?.focus()
      }
      if (event.key === 'Escape') {
        setShowSearchResults(false)
        setShowNotifications(false)
        setShowHelp(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSelect = (result: SearchResult) => {
    router.push(result.href)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const getNotificationColor = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  // Get only the 5 most recent notifications for the dropdown
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 gap-4 h-16">
      {/* Mobile Menu & Search */}
      <div className="flex items-center flex-1 gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-border/50">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>

        {/* Global Search */}
        <div ref={searchRef} className={`relative w-full max-w-md transition-all duration-300 ${isSearchFocused ? 'max-w-lg' : 'max-w-md'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="global-search"
            placeholder="Search... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20 transition-all h-9 md:h-10"
            onFocus={() => {
              setIsSearchFocused(true)
              if (searchQuery) setShowSearchResults(true)
            }}
          />

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${result.type === 'help' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
                      }`}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {showSearchResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 p-4 text-center">
              <p className="text-muted-foreground text-sm">No results found for &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Help Button */}
        <div ref={helpRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={`text-muted-foreground hover:text-foreground hidden sm:flex h-9 w-9 ${showHelp ? 'bg-muted' : ''}`}
            onClick={() => {
              setShowHelp(!showHelp)
              setShowNotifications(false)
            }}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Help Dropdown */}
          {showHelp && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Help & Resources</h3>
                <p className="text-xs text-muted-foreground">Quick access to documentation and support</p>
              </div>
              <div className="p-2">
                {helpTopics.map((topic, index) => (
                  <Link
                    key={index}
                    href={topic.href}
                    onClick={() => setShowHelp(false)}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{topic.title}</p>
                      <p className="text-xs text-muted-foreground">{topic.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <div className="p-2 border-t">
                <Link
                  href="/docs"
                  onClick={() => setShowHelp(false)}
                  className="flex items-center justify-center gap-2 w-full p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  View Full Documentation
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={`text-muted-foreground hover:text-foreground relative h-9 w-9 ${showNotifications ? 'bg-muted' : ''}`}
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowHelp(false)
            }}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full ring-2 ring-background text-[10px] text-white font-medium flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col">
              <div className="p-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{unread} unread</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  {unread > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getNotificationColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-primary hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium text-sm mb-1">All caught up!</p>
                    <p className="text-muted-foreground text-xs">No new notifications</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-center justify-center w-full p-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                >
                  View all {notifications.length} notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border/50 hidden sm:block mx-1" />

        <ThemeToggle />

        <div className="pl-1">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-background hover:ring-primary/20 transition-all",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}