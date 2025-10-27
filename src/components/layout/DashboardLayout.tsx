
"use client";

import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarProvider, // We will wrap this layout with SidebarProvider externally
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar, // To get isMobile, openMobile, setOpenMobile
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
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
  Settings as SettingsIcon, 
  ShieldEllipsis,
  ClipboardList,
  HelpCircle,
  PanelLeft,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSiteSettings } from '@/hooks/useSiteSettings'; 
import type { NavItemConfig } from '@/config/dashboardNavs';
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CustomLogo } from "@/components/ui/CustomLogo";
import { Footer } from "./Footer"; 

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
  Settings: SettingsIcon, 
  ShieldEllipsis,
  ClipboardList,
  HelpCircle,
  CreditCard: require('lucide-react').CreditCard
};

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItemConfig[];
}


export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { portalName, isLoadingSiteSettings } = useSiteSettings(); 
  const { isMobile, openMobile, setOpenMobile } = useSidebar(); // Consume from context

  const getInitials = (name?: string | null) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoadingSiteSettings || !user || isMobile === undefined) { // Wait for isMobile determination
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-lg text-primary font-semibold">جارٍ التحميل...</p>
      </div>
    );
  }

  const normalizedRole = (user.role === 'ADMIN' ? 'admin' : 'client') as 'admin' | 'client';
  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(normalizedRole));
  const displaySidebarPortalName = isLoadingSiteSettings ? "..." : portalName.split(" ").slice(0, 2).join(" ");


  return (
      <>
        <div className="flex min-h-screen bg-background relative pb-16 md:pb-0">
        {/* Removed floating theme switcher button to avoid duplication */}

        <Sidebar collapsible="icon" side="right"> {/* Sidebar will use useSidebar().isMobile internally */}
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary font-headline">
                <CustomLogo className="h-10 w-10" />
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
                      isActive={pathname === item.href || (item.href !== (normalizedRole === 'admin' ? "/admin/dashboard" : "/client/dashboard") && pathname.startsWith(item.href))}
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
          <SidebarFooter className="p-4 border-t border-sidebar-border space-y-4">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground">{user?.name || "مستخدم"}</p>
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
          <header className="sticky top-0 z-50 bg-background border-b border-border h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 shadow-md">
            <div className="flex items-center flex-1 min-w-0 gap-2">
              {/* Mobile Back Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-foreground hover:bg-muted flex-shrink-0"
                onClick={() => router.back()}
                aria-label="الرجوع"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <SidebarTrigger className="me-2 sm:me-4 lg:hidden flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-semibold font-headline text-primary truncate">
                {filteredNavItems.find(item => pathname === item.href || (item.href !== (normalizedRole === 'admin' ? "/admin/dashboard" : "/client/dashboard") && pathname.startsWith(item.href)))?.label || "لوحة التحكم"}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Small minimal theme switcher */}
              <ThemeSwitcher minimal className="hover:bg-muted/50" />
            </div>
          </header>
          <div className="flex-grow p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 overflow-auto max-w-[1920px] mx-auto w-full">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
