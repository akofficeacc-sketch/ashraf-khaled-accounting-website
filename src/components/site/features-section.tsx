"use client";

import { useLang } from "@/components/site/lang-provider";
import { content } from "@/lib/site-content";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Shield, Users } from "lucide-react";

const icons = [Users, Clock, Shield, CheckCircle];

export function FeaturesSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            {t.why.eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.why.title}</h2>
          <p className="text-muted-foreground text-lg">{t.why.copy}</p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.why.benefits.map((benefit, index) => {
            const Icon = icons[index] || CheckCircle;
            return (
              <Card 
                key={index} 
                className="border-border/50 hover:shadow-xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-accent mx-auto mb-4 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm text-primary font-semibold mb-2">{benefit.n}</div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Process Steps */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12">{t.process.title}</h3>
          <div className="grid md:grid-cols-4 gap-8">
            {t.process.steps.map((step, index) => (
              <div key={index} className="relative animate-scale-in" style={{ animationDelay: `${index * 0.15}s` }}>
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border" />
                )}
                
                <div className="relative text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl relative z-10">
                    {step.n}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
