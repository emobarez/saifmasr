
import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { clientNavItems } from '@/config/dashboardNavs';

export default function ClientAreaLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout navItems={clientNavItems}>
      {children}
    </DashboardLayout>
  );
}
