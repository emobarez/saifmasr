
import { Facebook, Twitter, Linkedin, Instagram, ShieldHalf } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-primary mb-4">
              <ShieldHalf className="h-8 w-8 text-primary" />
              <span>سيف مصر الوطنية للأمن</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              نقدم خدمات شاملة لتلبية احتياجات عملائنا بأعلى معايير الجودة والاحترافية.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#services" className="hover:text-primary transition-colors">الخدمات</Link></li>
              <li><Link href="/#about" className="hover:text-primary transition-colors">من نحن</Link></li>
              <li><Link href="/#contact" className="hover:text-primary transition-colors">اتصل بنا</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-headline">تابعنا</h3>
            <div className="flex space-x-4 space-x-reverse">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={24} />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={24} />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin size={24} />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={24} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} سيف مصر الوطنية للأمن. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
