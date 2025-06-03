
import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { adminNavItems } from '@/config/dashboardNavs';

export default function AdminAreaLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout navItems={adminNavItems}>
      {children}
    </DashboardLayout>
  );
}
