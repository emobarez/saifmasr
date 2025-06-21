
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Menu, ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useState, useEffect } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import Image from "next/image";

const navLinks = [
  { href: "/services", label: "الخدمات" },
  { href: "/#about", label: "من نحن" },
  { href: "/#contact", label: "اتصل بنا" },
];

export function Header() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { portalName, logoUrl, isLoadingSiteSettings } = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    } else {
      router.push('/auth/login');
    }
  };

  const getAuthButtonLabel = () => {
    if (authLoading) return "...";
    return user ? "لوحة التحكم" : "تسجيل الدخول";
  }

  const displayPortalName = isLoadingSiteSettings ? "..." : portalName;

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white text-gray-900">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-headline text-lg font-semibold text-gray-900">
          {logoUrl && logoUrl.trim() !== '' ? (
            <Image src={logoUrl} alt={`${displayPortalName} Logo`} width={32} height={32} className="h-8 w-auto object-contain"/>
          ) : (
            <ShieldHalf className="h-7 w-7 text-primary" />
          )}
          <span>{displayPortalName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher className="text-gray-600 hover:text-gray-900" />
          <Button onClick={handleAuthAction} variant="default" size="sm" className="font-semibold bg-black text-white hover:bg-black/90" disabled={authLoading}>
            {getAuthButtonLabel()}
          </Button>
          {user && !authLoading && (
            <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" size="sm">تسجيل الخروج</Button>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="font-body">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4" onClick={handleMobileLinkClick}>
                   {logoUrl && logoUrl.trim() !== '' ? (
                      <Image src={logoUrl} alt={`${displayPortalName} Logo`} width={28} height={28} className="h-7 w-auto object-contain"/>
                    ) : (
                      <ShieldHalf className="h-6 w-6 text-primary" />
                    )}
                   <span>{displayPortalName}</span>
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-foreground/80 transition-colors hover:text-foreground"
                    onClick={handleMobileLinkClick}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
