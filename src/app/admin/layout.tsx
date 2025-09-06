"use client";

import { AdminSidebar, MobileAdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-sidebar-border bg-sidebar overflow-y-auto">
          <AdminSidebar />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-lg font-semibold">إدارة النظام</h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
            <MobileAdminSidebar />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:mr-64">
        {/* Desktop Top Bar with Theme Switcher */}
        <header className="hidden md:flex sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 md:px-6 flex items-center justify-end gap-3">
            <ThemeSwitcher className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}