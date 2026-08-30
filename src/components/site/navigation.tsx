"use client";

import { useState } from "react";
import { useLang } from "@/components/site/lang-provider";
import { CONTACT, content } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Phone, Mail, MapPin, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Navigation() {
  const { lang, setLang } = useLang();
  const t = content[lang];
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: t.nav.services, href: "#services" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.why, href: "#features" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <a
                href={`tel:${CONTACT.ashraf.tel}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">{CONTACT.ashraf.display}</span>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{CONTACT.email}</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="hover:opacity-80 transition-opacity font-medium"
              >
                {lang === "ar" ? "EN" : "عربي"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:opacity-80 transition-opacity"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                AK
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg">{lang === "ar" ? "مكتب AK" : "AK Office"}</div>
                <div className="text-xs text-muted-foreground">
                  {lang === "ar" ? "للمحاسبة والضرائب" : "Accounting & Tax"}
                </div>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                {t.nav.cta}
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={lang === "ar" ? "left" : "right"} className="w-80">
                <div className="flex flex-col gap-6 mt-8">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <Button className="bg-gradient-primary hover:opacity-90 transition-opacity w-full">
                    {t.nav.cta}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
