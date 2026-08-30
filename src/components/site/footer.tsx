"use client";

import { useLang } from "@/components/site/lang-provider";
import { content, CONTACT } from "@/lib/site-content";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const { lang } = useLang();
  const t = content[lang];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                AK
              </div>
              <div>
                <div className="font-bold text-lg">{lang === "ar" ? "مكتب AK" : "AK Office"}</div>
                <div className="text-xs text-muted-foreground">
                  {lang === "ar" ? "للمحاسبة والضرائب" : "Accounting & Tax"}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "ar" 
                ? "شريكك الموثوق في المحاسبة والضرائب وتأسيس الشركات في مصر"
                : "Your trusted partner for accounting, tax, and company formation in Egypt"}
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold mb-4">{t.nav.services}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.services.items.slice(0, 6).map((service, i) => (
                <li key={i}>
                  <a href="#services" className="hover:text-foreground transition-colors">
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">
              {lang === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground transition-colors">{t.nav.about}</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">{t.nav.why}</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">{t.nav.contact}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">{t.nav.contact}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href={`tel:${CONTACT.ashraf.tel}`} className="hover:text-foreground transition-colors block">
                  {CONTACT.ashraf.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-foreground transition-colors">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <span>{lang === "ar" ? CONTACT.addressShortAr : CONTACT.addressShortEn}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {currentYear} {lang === "ar" ? "مكتب محاسبة أشرف منسي وخالد الصادق" : "Ashraf & Khaled Accounting Office"}
          </p>
          <p>
            {lang === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </footer>
  );
}
