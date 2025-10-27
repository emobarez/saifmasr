
"use client";
import { Facebook, Twitter, Linkedin, Instagram, Phone, Mail, MapPin, Home, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { CustomLogo } from "@/components/ui/CustomLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const { 
    portalName, 
    companyPhone, 
    companyAddress, 
    publicEmail, 
    socialFacebookUrl,
    socialTwitterUrl,
    socialLinkedinUrl,
    socialInstagramUrl,
    isLoadingSiteSettings 
  } = useSiteSettings(); 
  
  const displayPortalName = isLoadingSiteSettings ? "..." : portalName;

  const socialLinks = [
    { href: socialFacebookUrl, label: "Facebook", icon: Facebook },
    { href: socialTwitterUrl, label: "Twitter", icon: Twitter },
    { href: socialLinkedinUrl, label: "LinkedIn", icon: Linkedin },
    { href: socialInstagramUrl, label: "Instagram", icon: Instagram },
  ];

  const mobileNavItems = [
    { 
      href: "/", 
      label: "الرئيسية", 
      icon: Home,
      ariaLabel: "الصفحة الرئيسية"
    },
    { 
      href: "/services", 
      label: "الخدمات", 
      icon: Briefcase,
      ariaLabel: "صفحة الخدمات"
    },
    { 
      href: user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard') : '/auth/login', 
      label: "حسابي", 
      icon: User,
      ariaLabel: user ? "لوحة التحكم" : "تسجيل الدخول"
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - Only on Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-around gap-2 px-2 py-2">
          {mobileNavItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className="flex-1 h-auto py-2.5 px-2 flex flex-col items-center gap-1 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Link href={item.href} aria-label={item.ariaLabel}>
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Footer - Hidden on Desktop and Laptop */}
    </>
  );
}


