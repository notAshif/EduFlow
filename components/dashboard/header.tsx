// components/dashboard/header.tsx
'use client'

import { Bell, Search, HelpCircle, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/dashboard/sidebar'
import { useState } from 'react'

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);


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

        <div className={`relative w-full max-w-md transition-all duration-300 ${isSearchFocused ? 'max-w-lg' : 'max-w-md'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20 transition-all h-9 md:h-10"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex h-9 w-9">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-background" />
        </Button>

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