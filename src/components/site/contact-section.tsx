"use client";

import { useLang } from "@/components/site/lang-provider";
import { content, CONTACT } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";

export function ContactSection() {
  const { lang } = useLang();
  const t = content[lang];
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Form submission logic would go here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t.nav.contact}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {lang === "ar" ? "تواصل معنا اليوم" : "Get in Touch Today"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {lang === "ar" 
              ? "نحن هنا للإجابة على استفساراتك وتقديم الدعم الذي تحتاجه"
              : "We're here to answer your questions and provide the support you need"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-border/50 animate-scale-in">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {lang === "ar" ? "الاسم" : "Name"}
                    </Label>
                    <Input 
                      id="name" 
                      placeholder={lang === "ar" ? "أدخل اسمك" : "Enter your name"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder={lang === "ar" ? "01xxxxxxxxx" : "+20 1xxxxxxxxx"}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder={lang === "ar" ? "example@email.com" : "example@email.com"}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service">
                    {lang === "ar" ? "الخدمة المطلوبة" : "Service Required"}
                  </Label>
                  <Input 
                    id="service" 
                    placeholder={lang === "ar" ? "مثال: ضرائب، محاسبة" : "e.g., Tax, Accounting"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">
                    {lang === "ar" ? "رسالتك" : "Your Message"}
                  </Label>
                  <Textarea 
                    id="message" 
                    rows={4}
                    placeholder={lang === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      {lang === "ar" ? "جارٍ الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {lang === "ar" ? "إرسال الرسالة" : "Send Message"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6 animate-scale-in">
            {/* Contact Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Phone className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold mb-2">
                    {lang === "ar" ? "اتصل بنا" : "Call Us"}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <a href={`tel:${CONTACT.ashraf.tel}`} className="block hover:text-foreground">
                      {CONTACT.ashraf.display}
                    </a>
                    <a href={`tel:${CONTACT.khaled.tel}`} className="block hover:text-foreground">
                      {CONTACT.khaled.display}
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Mail className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold mb-2">
                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                  </h3>
                  <a 
                    href={`mailto:${CONTACT.email}`} 
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {CONTACT.email}
                  </a>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold mb-2">
                    {lang === "ar" ? "العنوان" : "Address"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? CONTACT.addressShortAr : CONTACT.addressShortEn}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Clock className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold mb-2">
                    {lang === "ar" ? "ساعات العمل" : "Working Hours"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "السبت - الخميس" : "Sat - Thu"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    09:00 - 17:00
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Map or Location Card */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-primary h-48 flex items-center justify-center text-white">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-semibold">
                      {lang === "ar" ? CONTACT.addressAr : CONTACT.addressEn}
                    </p>
                    <p className="text-sm opacity-80">
                      {lang === "ar" ? CONTACT.addressAr2 : CONTACT.addressEn2}
                    </p>
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
