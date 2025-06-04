
"use client";

import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  ShieldHalf, 
  LogOut, 
  LayoutDashboard,
  ListPlus,
  History,
  Receipt,
  UserCircle,
  Users,
  BriefcaseBusiness,
  FilePieChart,
  Sparkles,
  Settings as SettingsIcon, // Renamed to avoid conflict with Settings component
  ShieldEllipsis,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePortalName } from '@/hooks/usePortalName';
import type { NavItemConfig } from '@/config/dashboardNavs';


interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItemConfig[];
}

const iconMap: { [key: string]: ElementType } = {
  LayoutDashboard,
  ListPlus,
  History,
  Receipt,
  UserCircle,
  Users,
  BriefcaseBusiness,
  FilePieChart,
  Sparkles,
  Settings: SettingsIcon, // Use renamed import
  ShieldEllipsis,
  ClipboardList,
  ShieldHalf // Added for completeness, though not directly in navItems via string yet
};


export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { portalName: dynamicPortalName, isLoadingPortalName } = usePortalName();

  const getInitials = (name?: string | null) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (authLoading || isLoadingPortalName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-lg text-primary font-semibold">جارٍ التحميل...</p>
      </div>
    );
  }

  if (!user) {
    // This should ideally be handled by AuthContext redirects, but as a fallback:
    router.push('/auth/login');
    return null; 
  }

  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(user.role!));
  
  const displaySidebarPortalName = isLoadingPortalName ? "..." : dynamicPortalName.split(" ").slice(0, 2).join(" ");


  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" side="right">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary font-headline">
                <ShieldHalf className="h-7 w-7" />
                <span className="group-data-[collapsible=icon]:hidden">{displaySidebarPortalName}</span>
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 flex-grow">
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const IconComponent = iconMap[item.icon];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== (user?.role === 'admin' ? "/admin/dashboard" : "/client/dashboard") && pathname.startsWith(item.href))}
                      tooltip={{ children: item.label, side: 'left' }}
                    >
                      <Link href={item.href}>
                        {IconComponent && <IconComponent className="h-5 w-5" />}
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
             <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center mb-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                  <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.displayName || "مستخدم"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            <SidebarMenuButton
              onClick={signOut}
              tooltip={{ children: "تسجيل الخروج", side: 'left' }}
              className="w-full"
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border h-16 flex items-center px-6">
            <SidebarTrigger className="me-4 md:hidden" />
            <h1 className="text-xl font-semibold font-headline text-primary">
              {filteredNavItems.find(item => pathname === item.href || (item.href !== (user?.role === 'admin' ? "/admin/dashboard" : "/client/dashboard") && pathname.startsWith(item.href)))?.label || "لوحة التحكم"}
            </h1>
          </header>
          <div className="flex-grow p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
