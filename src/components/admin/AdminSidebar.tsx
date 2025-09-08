"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Menu,
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  Activity,
  Sparkles,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const itemColors: Record<string, string> = {
  "/admin/dashboard": "bg-amber-100 text-amber-600 ring-amber-200",
  "/admin/clients": "bg-sky-100 text-sky-600 ring-sky-200",
  "/admin/services": "bg-emerald-100 text-emerald-600 ring-emerald-200",
  "/admin/service-requests": "bg-orange-100 text-orange-600 ring-orange-200",
  "/admin/invoices": "bg-violet-100 text-violet-600 ring-violet-200",
  "/admin/employees": "bg-blue-100 text-blue-600 ring-blue-200",
  "/admin/reports": "bg-indigo-100 text-indigo-600 ring-indigo-200",
  "/admin/ai-tool": "bg-fuchsia-100 text-fuchsia-600 ring-fuchsia-200",
  "/admin/activity-log": "bg-cyan-100 text-cyan-600 ring-cyan-200",
  "/admin/settings": "bg-slate-100 text-slate-600 ring-slate-200",
};

const sidebarNavItems = [
  {
    title: "لوحة التحكم",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "إدارة العملاء",
    href: "/admin/clients",
    icon: Users,
  },
  {
    title: "إدارة الخدمات",
    href: "/admin/services",
    icon: ShieldCheck,
  },
  {
    title: "طلبات الخدمة",
    href: "/admin/service-requests",
    icon: ClipboardList,
  },
  {
    title: "الفواتير",
    href: "/admin/invoices",
    icon: Receipt,
  },
  {
    title: "الموظفين",
    href: "/admin/employees",
    icon: Users,
  },
  {
    title: "التقارير",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "أداة الذكاء الاصطناعي",
    href: "/admin/ai-tool",
    icon: Sparkles,
  },
  {
    title: "سجل الأنشطة",
    href: "/admin/activity-log",
    icon: Activity,
  },
  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className={cn("pb-24 relative z-[70]", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="rounded-2xl p-3 bg-gradient-to-b from-sidebar/60 to-sidebar/80 border border-sidebar-border shadow-sm">
            <div className="flex items-center px-3 py-2 text-sm font-semibold text-sidebar-foreground">
              <ShieldCheck className="mr-2 h-4 w-4 text-sidebar-primary" />
              سيف مصر للأمن
            </div>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-2">
            {sidebarNavItems.map((item) => {
              const active = pathname === item.href;
              const colorClasses = itemColors[item.href] ?? "bg-muted text-foreground/80 ring-border";
              return (
                <Button
                  key={item.href}
                  variant="outline"
                  className={cn(
                    "w-full justify-start rounded-full px-2 py-2 transition",
                    active
                      ? "bg-white shadow-md ring-1 ring-sidebar-border text-sidebar-foreground dark:text-slate-900"
                      : "border-transparent text-sidebar-foreground/85 hover:text-sidebar-foreground dark:hover:text-slate-900 hover:bg-white/70 hover:shadow-md hover:ring-1 hover:ring-sidebar-border"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <span className={cn("mr-3 flex h-7 w-7 items-center justify-center rounded-xl ring-1", colorClasses)}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border bg-sidebar/60 backdrop-blur supports-[backdrop-filter]:bg-sidebar/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-sidebar-foreground">{user?.name || 'المشرف'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}

interface MobileAdminSidebarProps {
  className?: string;
}

export function MobileAdminSidebar({ className }: MobileAdminSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-0 md:hidden shrink-0 no-tap-highlight",
            className
          )}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0 w-80">
        <SheetHeader>
          <SheetTitle>القائمة الجانبية</SheetTitle>
        </SheetHeader>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pr-6">
          <MobileAdminSidebarContent onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface MobileAdminSidebarContentProps {
  onNavigate: () => void;
}

function MobileAdminSidebarContent({ onNavigate }: MobileAdminSidebarContentProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    onNavigate();
    signOut();
  };

  return (
    <div className="pb-24 relative">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="rounded-2xl p-3 bg-gradient-to-b from-sidebar/60 to-sidebar/80 border border-sidebar-border shadow-sm">
            <div className="flex items-center px-3 py-2 text-sm font-semibold text-sidebar-foreground">
              <ShieldCheck className="mr-2 h-4 w-4 text-sidebar-primary" />
              سيف مصر للأمن
            </div>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-2">
            {sidebarNavItems.map((item) => {
              const active = pathname === item.href;
              const colorClasses = itemColors[item.href] ?? "bg-muted text-foreground/80 ring-border";
              return (
                <Button
                  key={item.href}
                  variant="outline"
                  className={cn(
                    "w-full justify-start rounded-full px-2 py-2 transition",
                    active
                      ? "bg-white shadow-md ring-1 ring-sidebar-border text-sidebar-foreground dark:text-slate-900"
                      : "border-transparent text-sidebar-foreground/85 hover:text-sidebar-foreground dark:hover:text-slate-900 hover:bg-white/70 hover:shadow-md hover:ring-1 hover:ring-sidebar-border"
                  )}
                  asChild
                >
                  <Link href={item.href} onClick={onNavigate}>
                    <span className={cn("mr-3 flex h-7 w-7 items-center justify-center rounded-xl ring-1", colorClasses)}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border bg-sidebar/60 backdrop-blur supports-[backdrop-filter]:bg-sidebar/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-sidebar-foreground">{user?.name || 'المشرف'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}