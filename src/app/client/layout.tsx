import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { clientNavItems } from '@/config/dashboardNavs';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider

export default function ClientAreaLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen> {/* Wrap with SidebarProvider */}
      <DashboardLayout navItems={clientNavItems}>
        {children}
      </DashboardLayout>
    </SidebarProvider>
  );
}