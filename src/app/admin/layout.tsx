
import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { adminNavItems } from '@/config/dashboardNavs';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider

export default function AdminAreaLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen> {/* Wrap with SidebarProvider */}
      <DashboardLayout navItems={adminNavItems}>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  );
}
