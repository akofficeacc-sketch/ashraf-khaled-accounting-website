"use client";

import { useLang } from "@/components/site/lang-provider";
import { content } from "@/lib/site-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, DollarSign, Clock } from "lucide-react";

const icons = [DollarSign, TrendingUp, Calculator, Clock];

export function ToolsSection() {
  const { lang } = useLang();
  const t = content[lang];

  const tools = [
    { title: t.calc.tabs.payroll, desc: lang === "ar" ? "حاسبة كسب العمل للمرتبات" : "Payroll Tax Calculator" },
    { title: t.calc.tabs.income, desc: lang === "ar" ? "حاسبة ضريبة الدخل" : "Income Tax Calculator" },
    { title: t.calc.tabs.vatFine, desc: lang === "ar" ? "حاسبة الضريبة الإضافية" : "VAT Additional Tax Calculator" },
    { title: t.calc.tabs.delayFine, desc: lang === "ar" ? "حاسبة غرامة التأخير" : "Delay Fine Calculator" },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            {t.calc.eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.calc.title}</h2>
          <p className="text-muted-foreground text-lg">{t.calc.sub}</p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tools.map((tool, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 animate-scale-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-accent mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tool.desc}</p>
                  <Button variant="outline" className="w-full">
                    {lang === "ar" ? "احسب الآن" : "Calculate Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          {t.calc.disclaimer}
        </p>
      </div>
    </section>
  );
}
