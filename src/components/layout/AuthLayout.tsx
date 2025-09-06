"use client";
import { ShieldHalf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from '@/hooks/useSiteSettings'; // Updated import
import { ThemeSwitcher } from "./ThemeSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const { portalName, isLoadingSiteSettings } = useSiteSettings(); // Updated hook usage
  const displayPortalName = isLoadingSiteSettings ? "..." : portalName;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Theme Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher className="text-foreground hover:text-primary hover:bg-accent rounded-md p-2 border border-border bg-background/80 backdrop-blur-sm" />
      </div>
      
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-start">
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-headline text-2xl font-semibold mb-6">
              <ShieldHalf className="h-8 w-8" />
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
          src="https://placehold.co/1000x1200.png"
          alt="Authentication Background"
          fill 
          style={{objectFit:"cover"}} 
          data-ai-hint="modern office"
        />
        <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center p-12 text-primary-foreground text-center">
          <h2 className="text-4xl font-bold font-headline mb-4">مرحباً بك في {displayPortalName}</h2>
          <p className="text-xl opacity-90">
            منصة متكاملة لجميع خدماتك. آمنة، سهلة، وفعالة.
          </p>
        </div>
      </div>
    </div>
  );
}