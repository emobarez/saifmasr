
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CustomLogo } from "@/components/ui/CustomLogo";

const navLinks = [
  { href: "/services", label: "الخدمات" },
  { href: "/#about", label: "من نحن" },
  { href: "/#contact", label: "اتصل بنا" },
];

export function Header() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { portalName, isLoadingSiteSettings } = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (user) {
      if (user.role === 'ADMIN') {
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
    router.push('/services');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card text-foreground">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile Back Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground hover:bg-muted"
            onClick={() => router.back()}
            aria-label="الرجوع"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <Link href="/" className="flex items-center gap-2 font-headline text-sm sm:text-base md:text-lg font-semibold text-foreground">
            <CustomLogo className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            <span className="line-clamp-1">{displayPortalName}</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

  <div className="flex items-center gap-2">
          <ThemeSwitcher minimal />
          <Button onClick={handleAuthAction} variant="default" size="sm" className="font-semibold !bg-primary !text-primary-foreground hover:!bg-primary/90" disabled={authLoading}>
            {getAuthButtonLabel()}
          </Button>
          {user && !authLoading && (
            <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" size="sm" className="text-foreground border-border hover:bg-muted">
              تسجيل الخروج
            </Button>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden text-foreground border-border" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="font-body">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4" onClick={handleMobileLinkClick}>
                   <CustomLogo className="h-10 w-10" />
                   <span>{displayPortalName}</span>
                </Link>
                <Link
                  href="/services"
                  className="text-foreground/80 transition-colors hover:text-foreground"
                  onClick={handleMobileLinkClick}
                >
                  الخدمات
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
