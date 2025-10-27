"use client";
import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from '@/hooks/useSiteSettings'; // Updated import
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CustomLogo } from "@/components/ui/CustomLogo";
import { Footer } from "./Footer";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const { portalName, isLoadingSiteSettings } = useSiteSettings(); // Updated hook usage
  const displayPortalName = isLoadingSiteSettings ? "..." : portalName;

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background pb-16 md:pb-0">
      {/* Theme Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher minimal className="bg-background/80 backdrop-blur-sm border border-border hover:bg-accent" />
      </div>
      
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 order-2 lg:order-1">
        {/* Security Badge for Mobile */}
        <div className="lg:hidden mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <CustomLogo className="h-20 w-20" />
          </div>
          <p className="text-sm text-muted-foreground">خدمات أمنية متقدمة ومتكاملة</p>
        </div>
        
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-start">
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-headline text-2xl font-semibold mb-6">
              <CustomLogo className="h-12 w-12" />
              <span>{displayPortalName}</span>
            </Link>
            <h1 className="text-3xl font-bold font-headline text-primary">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="lg:w-1/2 relative order-1 lg:order-2 hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1226&q=80"
          alt="شركة الأمن - حراسة مهنية وحماية متقدمة"
          fill 
          style={{objectFit:"cover"}} 
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center p-12 text-primary-foreground text-center">
          <div className="mb-6">
            <CustomLogo className="h-32 w-32 mx-auto mb-4 drop-shadow-lg" />
          </div>
          <h2 className="text-4xl font-bold font-headline mb-4 drop-shadow-lg">مرحباً بك في {displayPortalName}</h2>
          <p className="text-xl opacity-90 drop-shadow-md max-w-md">
            منصة متكاملة لجميع خدماتك الأمنية. آمنة، سهلة، وفعالة.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm opacity-75">خدمة مستمرة</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm opacity-75">أمان وثقة</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">∞</div>
              <div className="text-sm opacity-75">حلول متقدمة</div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}