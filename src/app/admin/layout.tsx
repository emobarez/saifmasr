"use client";

import { AdminSidebar, MobileAdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop Sidebar (right-aligned) */}
  <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:right-0 md:z-[70]">
        <div className="flex flex-col flex-grow border-l border-sidebar-border bg-sidebar overflow-y-auto">
          <AdminSidebar />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        {/* Mobile Top Bar: hamburger only */}
        <div className="sticky top-0 z-50 flex items-center justify-start h-12 sm:h-12 px-3 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm no-tap-highlight">
          <MobileAdminSidebar />
        </div>
      </div>

  {/* Main Content (offset for right sidebar) */}
      <div className="flex flex-col flex-1 md:mr-64">
        {/* Desktop Top Bar with Theme Switcher */}
          <header className="hidden md:flex sticky top-0 z-50 bg-card border-b shadow-sm">
            <div className="w-full px-4 py-3 md:px-6 flex items-center justify-end gap-3">
            <NotificationBell />
            <ThemeSwitcher minimal className="bg-primary text-primary-foreground hover:bg-primary/90" />
          </div>
        </header>
          <main className="flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-y-contain touch-pan-x touch-pan-y bg-background">
            {children}
          </main>
      </div>
    </div>
  );
}