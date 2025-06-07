
"use client";
import { Facebook, Twitter, Linkedin, Instagram, ShieldHalf, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from '@/hooks/useSiteSettings'; 

export function Footer() {
  const currentYear = new Date().getFullYear();
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

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-primary mb-4">
              <ShieldHalf className="h-8 w-8 text-primary" />
              <span>{displayPortalName}</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              نقدم خدمات شاملة لتلبية احتياجات عملائنا بأعلى معايير الجودة والاحترافية.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-primary transition-colors">الخدمات</Link></li>
              <li><Link href="/#about" className="hover:text-primary transition-colors">من نحن</Link></li>
              <li><Link href="/#contact" className="hover:text-primary transition-colors">اتصل بنا</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">معلومات الاتصال</h3>
            {isLoadingSiteSettings ? (
              <p className="text-sm text-muted-foreground">جارٍ تحميل معلومات الاتصال...</p>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {publicEmail && (
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-1 text-primary/70 shrink-0" />
                    <a href={`mailto:${publicEmail}`} className="hover:text-primary transition-colors break-all">{publicEmail}</a>
                  </li>
                )}
                {companyPhone && (
                  <li className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-1 text-primary/70 shrink-0" />
                    <a href={`tel:${companyPhone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">{companyPhone}</a>
                  </li>
                )}
                {companyAddress && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-primary/70 shrink-0" />
                    <span>{companyAddress}</span>
                  </li>
                )}
                {(!publicEmail && !companyPhone && !companyAddress && !isLoadingSiteSettings) && (
                    <li>لا توجد معلومات اتصال متاحة حاليًا.</li>
                )}
              </ul>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">تابعنا</h3>
            {isLoadingSiteSettings ? (
               <p className="text-sm text-muted-foreground">جارٍ تحميل الروابط...</p>
            ) : (
                <div className="flex space-x-4 space-x-reverse">
                {socialLinks.map(social => {
                    if (social.href) {
                    const IconComponent = social.icon;
                    return (
                        <Link key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <IconComponent size={24} />
                        </Link>
                    );
                    }
                    return null;
                })}
                {!isLoadingSiteSettings && socialLinks.every(link => !link.href) && (
                    <p className="text-sm text-muted-foreground">لا توجد روابط تواصل اجتماعي متاحة.</p>
                )}
                </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {displayPortalName}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}

