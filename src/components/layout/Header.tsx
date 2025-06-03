
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/#services", label: "الخدمات" },
  { href: "/#about", label: "من نحن" },
  { href: "/#contact", label: "اتصل بنا" },
];

export function Header() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

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
    if (loading) return "...";
    return user ? "لوحة التحكم" : "تسجيل الدخول";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
          <ShieldHalf className="h-7 w-7 text-primary" />
          <span>سيف مصر الوطنية للأمن</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button onClick={handleAuthAction} variant="default" size="sm" className="font-semibold">
            {getAuthButtonLabel()}
          </Button>
          {user && !loading && (
            <Button onClick={signOut} variant="outline" size="sm">تسجيل الخروج</Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="font-body">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
                   <ShieldHalf className="h-6 w-6 text-primary" />
                   <span>سيف مصر الوطنية للأمن</span>
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-foreground/80 transition-colors hover:text-foreground"
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
