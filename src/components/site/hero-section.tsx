"use client";

import { useLang } from "@/components/site/lang-provider";
import { content } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield, Clock } from "lucide-react";

export function HeroSection() {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-50" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {t.hero.eyebrow}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t.hero.title}
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t.hero.lead}
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2">
                {t.hero.ctaPrimary}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                {t.hero.ctaSecondary}
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border/50">
              {t.metrics.slice(0, 3).map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-3xl font-bold text-gradient-primary">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hero Image/Illustration */}
          <div className="relative animate-scale-in hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Card */}
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl p-8 shadow-2xl glow-primary">
                <div className="h-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                        AK
                      </div>
                      <div>
                        <div className="text-white font-bold text-xl">AK Office</div>
                        <div className="text-white/70 text-sm">{t.hero.dashboard.brandSub}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-white/70 text-sm mb-2">{t.hero.dashboard.statusLabel}</div>
                        <div className="text-white font-semibold text-lg">{t.hero.dashboard.statusValue}</div>
                      </div>
                      
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-white/70 text-sm mb-2">{t.hero.dashboard.progressLabel}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full"
                              style={{ width: `${t.hero.dashboard.progressPct}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold">{t.hero.dashboard.progressPct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {t.hero.dashboard.steps.map((step, i) => (
                      <div key={i} className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                        <div className="text-white text-sm">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-card rounded-xl p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.hero.dashboard.floatTopTitle}</div>
                    <div className="text-xs text-muted-foreground">{t.hero.dashboard.floatTopSub}</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-card rounded-xl p-4 shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.hero.dashboard.floatBottomTitle}</div>
                    <div className="text-xs text-muted-foreground">{t.hero.dashboard.floatBottomSub}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
