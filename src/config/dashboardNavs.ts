
import type { ElementType } from "react";
import {
  LayoutDashboard,
  ListPlus,
  History,
  Receipt,
  UserCircle,
  Users, // For managing employees
  BriefcaseBusiness,
  FilePieChart,
  Sparkles,
  Settings,
  ShieldEllipsis,
  ClipboardList,
  HelpCircle, // Added HelpCircle
  FileText, // Added FileText for drafts
  CreditCard // Added CreditCard for payment
} from "lucide-react";

export interface NavItemConfig {
  href: string;
  label: string;
  icon: string; 
  allowedRoles: Array<"client" | "admin">;
  subItems?: NavItemConfig[];
}

export const clientNavItems: NavItemConfig[] = [
  { href: "/client/dashboard", label: "لوحة التحكم الرئيسية", icon: "LayoutDashboard", allowedRoles: ["client"] },
  { href: "/client/requests", label: "طلب خدمة", icon: "ListPlus", allowedRoles: ["client"] },
  { href: "/client/tracking", label: "تتبع الطلبات", icon: "History", allowedRoles: ["client"] },
  { href: "/client/invoices", label: "الفواتير", icon: "Receipt", allowedRoles: ["client"] },
  { href: "/client/payment", label: "الدفع الإلكتروني", icon: "CreditCard", allowedRoles: ["client"] },
  { href: "/client/profile", label: "الملف الشخصي", icon: "UserCircle", allowedRoles: ["client"] },
];

export const adminNavItems: NavItemConfig[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم الرئيسية", icon: "ShieldEllipsis", allowedRoles: ["admin"] },
  { href: "/admin/clients", label: "إدارة العملاء", icon: "Users", allowedRoles: ["admin"] },
  { href: "/admin/services", label: "إدارة الخدمات", icon: "BriefcaseBusiness", allowedRoles: ["admin"] },
  { href: "/admin/service-requests", label: "طلبات الخدمة", icon: "ClipboardList", allowedRoles: ["admin"] },
  { href: "/admin/invoices", label: "إدارة الفواتير", icon: "Receipt", allowedRoles: ["admin"] },
  { href: "/admin/employees", label: "إدارة الموظفين", icon: "Users", allowedRoles: ["admin"] },
  { href: "/admin/reports", label: "التقارير", icon: "FilePieChart", allowedRoles: ["admin"] },
  { href: "/admin/ai-tool", label: "أداة الذكاء الاصطناعي", icon: "Sparkles", allowedRoles: ["admin"] },
  { 
    href: "/admin/activity-log", 
    label: "سجل الأنشطة", 
    icon: "History", 
    allowedRoles: ["admin"],
    subItems: [
      { href: "/admin/activity-log", label: "عرض السجل", icon: "History", allowedRoles: ["admin"] },
      { href: "/admin/activity-log/manage", label: "إدارة السجل", icon: "Settings", allowedRoles: ["admin"] }
    ]
  },
  { href: "/admin/settings", label: "الإعدادات", icon: "Settings", allowedRoles: ["admin"] },
];

export const allNavItems: NavItemConfig[] = [...clientNavItems, ...adminNavItems];

