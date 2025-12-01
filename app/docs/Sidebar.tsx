"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Bell, Zap, MessageSquare, Calendar } from "lucide-react";

const sidebarItems = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs", icon: BookOpen },
      { title: "Quick Start Guide", href: "/docs#quick-start", icon: Zap },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Attendance", href: "/docs#attendance", icon: Users },
      { title: "Assignments", href: "/docs#assignments", icon: BookOpen },
      { title: "Communications", href: "/docs#communications", icon: MessageSquare },
      { title: "Scheduling", href: "/docs#scheduling", icon: Calendar },
      { title: "Notifications", href: "/docs#notifications", icon: Bell },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-20 hidden lg:block overflow-y-auto">
      <div className="p-6 space-y-8">
        {sidebarItems.map((section, i) => (
          <div key={i}>
            <h4 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">
              {section.title}
            </h4>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <Link
                  key={j}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === item.href && !item.href.includes("#")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
