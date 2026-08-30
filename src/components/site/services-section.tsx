"use client";

import { useLang } from "@/components/site/lang-provider";
import { content } from "@/lib/site-content";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  Percent, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Receipt, 
  Wallet, 
  TrendingUp 
} from "lucide-react";

const iconMap: Record<string, any> = {
  book: BookOpen,
  percent: Percent,
  file: FileText,
  check: CheckCircle2,
  building: Building2,
  invoice: Receipt,
  wallet: Wallet,
  trending: TrendingUp,
};

export function ServicesSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t.services.eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.services.title}</h2>
          <p className="text-muted-foreground text-lg">{t.services.sub}</p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.services.items.map((service, index) => {
            const Icon = iconMap[service.icon] || BookOpen;
            return (
              <Card 
                key={service.key} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 animate-scale-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
