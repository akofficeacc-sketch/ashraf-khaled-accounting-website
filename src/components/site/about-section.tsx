"use client";

import { useLang } from "@/components/site/lang-provider";
import { content, CONTACT, getOfficeExperienceYears } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Users, Award, Clock } from "lucide-react";

export function AboutSection() {
  const { lang } = useLang();
  const t = content[lang];
  const years = getOfficeExperienceYears();

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {t.about.eyebrow}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              {t.about.title}
            </h2>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t.about.copy}
            </p>
            
            {/* Team Members */}
            <div className="grid sm:grid-cols-2 gap-4 pt-6">
              {[CONTACT.ashraf, CONTACT.khaled].map((member, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {member.nameEn.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-bold">{lang === "ar" ? member.nameAr : member.nameEn}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.about.members[i]?.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${member.tel}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={member.whatsapp} target="_blank" rel="noopener noreferrer">
                          {lang === "ar" ? "واتساب" : "WhatsApp"}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2">
              {t.about.cta}
            </Button>
          </div>
          
          {/* Stats & Info */}
          <div className="grid grid-cols-2 gap-4 animate-scale-in">
            <Card className="border-border/50 bg-gradient-primary text-white">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold mb-2">+{years}</div>
                <div className="text-white/80">{t.why.cardYearsLabel}</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardContent className="p-6 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">+350</div>
                <div className="text-sm text-muted-foreground">{t.metrics[1].label}</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 col-span-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">
                      {lang === "ar" ? CONTACT.addressAr : CONTACT.addressEn}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lang === "ar" ? CONTACT.addressAr2 : CONTACT.addressEn2}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
