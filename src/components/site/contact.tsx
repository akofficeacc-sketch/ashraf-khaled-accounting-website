"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowUp,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { CONTACT, content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { Eyebrow, ExtArrow, Reveal, btnGhostOnDark, btnPrimary } from "./primitives";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rememberContactSubmission } from "@/lib/contact-cookie";

type ContactField = "name" | "phone" | "email" | "service" | "message";

function FieldCue({ show, id, children }: { show: boolean; id: string; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div id={id} className="flex items-center gap-2 text-xs font-bold text-gold-2" role="status">
      <ArrowUp className="h-4 w-4 animate-bounce" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------- CTA banner -------------------------------- */

export function CtaBanner() {
  const { lang } = useLang();
  const t = content[lang].ctaBanner;
  return (
    <section className="bg-deep-2 py-14 text-cream lg:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="relative flex flex-col items-center">
          <Reveal>
            <Eyebrow light>{t.badge}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{t.title}</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 max-w-xl text-[15px] leading-8 text-cream/70">{t.copy}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href="#contact" className={btnPrimary}>
                {t.primary}
                <ExtArrow />
              </a>
              <a href={`tel:${CONTACT.ashraf.tel}`} className={btnGhostOnDark} dir="ltr">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {CONTACT.ashraf.display}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ contact section ------------------------------ */

function PartnerContact({
  name,
  phone,
  tel,
  whatsapp,
  whatsappLabel,
}: {
  name: string;
  phone: string;
  tel: string;
  whatsapp: string;
  whatsappLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 py-3 ps-11">
      <div className="leading-tight">
        <strong className="block text-sm font-extrabold text-cream">{name}</strong>
        <a
          href={`tel:${tel}`}
          dir="ltr"
          className="mt-1 inline-block text-sm font-bold text-gold transition-opacity hover:opacity-80"
        >
          {phone}
        </a>
      </div>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-cream/80 transition-colors hover:text-gold"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {whatsappLabel}
      </a>
    </div>
  );
}

export function ContactSection() {
  const { lang } = useLang();
  const t = content[lang];
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
    website: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [attentionField, setAttentionField] = React.useState<ContactField | null>(null);

  function reportFieldError(field: ContactField, message: string) {
    setSubmitError(message);
    setAttentionField(field);
    const element = document.getElementById(`cf-${field}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element.focus({ preventScroll: true }), 250);
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (attentionField === key) {
        setAttentionField(null);
        setSubmitError(null);
      }
    };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    // Field-specific validation so the user always knows exactly what to fix.
    const name = form.name.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();
    const email = form.email.trim();
    const service = form.service.trim();

    setSubmitError(null);
    setAttentionField(null);

    if (!name) {
      reportFieldError("name", lang === "ar" ? "يرجى كتابة الاسم بالكامل." : "Please enter your full name.");
      return;
    }
    if (name.length < 2) {
      reportFieldError(
        "name",
        lang === "ar"
          ? "يرجى كتابة الاسم بالكامل (حرفان على الأقل)."
          : "The name field is incomplete — please enter your full name (at least 2 characters).",
      );
      return;
    }
    if (!phone) {
      reportFieldError("phone", lang === "ar" ? "يرجى إدخال رقم الهاتف." : "Please enter your phone number.");
      return;
    }
    if (phone.length < 7) {
      reportFieldError(
        "phone",
        lang === "ar"
          ? "رقم الهاتف غير مكتمل — مثال: 0100 123 4567 أو +20 100 123 4567."
          : "The phone field is incomplete — e.g. 0100 123 4567 or +20 100 123 4567.",
      );
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      reportFieldError("email", lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.");
      return;
    }
    if (!service) {
      reportFieldError("service", lang === "ar" ? "يرجى اختيار الخدمة المطلوبة." : "Please choose a requested service.");
      return;
    }
    if (!message) {
      reportFieldError("message", lang === "ar" ? "يرجى كتابة رسالتك." : "Please tell us how we can help.");
      return;
    }
    if (message.length < 5) {
      reportFieldError(
        "message",
        lang === "ar"
          ? `رسالتك قصيرة جدًا (${message.length} من 5 أحرف) — اكتب نبذة أوضح حتى نتمكن من مساعدتك.`
          : `Your message is too short (${message.length} of 5 characters) — please tell us a bit more so we can help.`,
      );
      return;
    }

    setSubmitError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          service: service || undefined,
          message: form.message.trim(),
          website: form.website,
          lang,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { code?: string; message?: string } }
        | null;
      if (!res.ok || !data?.ok) {
        if (res.status === 429) {
          throw new Error(
            lang === "ar"
              ? "تم إرسال عدة طلبات بسرعة. انتظر دقيقة ثم حاول مجددًا."
              : "Too many requests. Please wait a minute and try again."
          );
        }
        if (data?.error?.code === "INVALID_PHONE" || data?.error?.message?.startsWith("phone:")) {
          reportFieldError(
            "phone",
            lang === "ar"
              ? "أدخل رقم موبايل مصري صحيح، مثال: +20 100 123 4567."
              : "Enter a valid Egyptian mobile number, e.g. +20 100 123 4567.",
          );
          return;
        }
        if (data?.error?.message?.startsWith("service:")) {
          reportFieldError("service", lang === "ar" ? "يرجى اختيار الخدمة المطلوبة." : "Please choose a requested service.");
          return;
        }
        if (data?.error?.code === "MESSAGE_LINK_NOT_ALLOWED" || data?.error?.code === "LINK_NOT_ALLOWED") {
          throw new Error(
            lang === "ar"
              ? "لا يمكن إرسال روابط في بيانات التواصل. احذف الرابط وحاول مرة أخرى."
              : "Links are not allowed in the contact details. Please remove the link and try again."
          );
        }
        if (res.status === 400) {
          throw new Error(
            lang === "ar"
              ? "تحقق من البيانات المطلوبة وحاول مرة أخرى."
              : "Please check the required details and try again."
          );
        }
        throw new Error(
          lang === "ar"
            ? "تعذّر الحفظ مؤقتًا. يمكنك التواصل معنا هاتفيًا."
            : "We could not save your request right now. Please call us instead."
        );
      }
      rememberContactSubmission();
      setDone(true);
      toast.success(t.contact.form.successTitle);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.contact.form.errorBody;
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const f = t.contact.form;
  const inputCls =
    "h-14 w-full border-b-2 border-t-0 border-x-0 border-border/50 bg-transparent px-0 py-3 text-start text-foreground placeholder:font-medium placeholder:text-muted-foreground/60 shadow-none focus:border-b-2 focus:border-gold focus:ring-0 focus-visible:ring-0 rounded-none";

  return (
    <section id="contact" className="scroll-mt-24 bg-deep py-20 text-cream lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <Reveal variant="right">
          <div className="relative h-full text-cream lg:py-2 lg:pe-6">
            <div className="relative">
              <Eyebrow light>{t.contact.eyebrow}</Eyebrow>
              <h2 className="mt-5 text-3xl font-black leading-[1.25] tracking-tight md:text-4xl">{t.contact.title}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-8 text-cream/70">{t.contact.copy}</p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-[5px] border border-gold/40 font-mono text-xs font-semibold tabular-nums text-gold">
                      01
                    </span>
                    <small className="text-[11px] font-semibold ltr:uppercase ltr:tracking-[0.18em] rtl:tracking-normal text-cream/50">
                      {t.contact.details.call}
                    </small>
                  </div>
                  <div className="mt-3 space-y-2.5 ps-11">
                    <PartnerContact
                      name={lang === "ar" ? "أشرف منسي" : "Ashraf Mansy"}
                      phone={CONTACT.ashraf.display}
                      tel={CONTACT.ashraf.tel}
                      whatsapp={CONTACT.ashraf.whatsapp}
                      whatsappLabel={t.contact.details.whatsapp}
                    />
                    <PartnerContact
                      name={lang === "ar" ? "خالد الصادق" : "Khaled El-Sadek"}
                      phone={CONTACT.khaled.display}
                      tel={CONTACT.khaled.tel}
                      whatsapp={CONTACT.khaled.whatsapp}
                      whatsappLabel={t.contact.details.whatsapp}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-[5px] border border-gold/40 font-mono text-xs font-semibold tabular-nums text-gold">
                      02
                    </span>
                    <small className="text-[11px] font-semibold ltr:uppercase ltr:tracking-[0.18em] rtl:tracking-normal text-cream/50">
                      {t.contact.details.write}
                    </small>
                  </div>
                  <div className="mt-3 ps-11">
                    <a
                      href={`mailto:${CONTACT.email}`}
                      dir="ltr"
                      className="inline-flex items-center gap-2.5 border-b border-gold/30 pb-1 text-sm font-bold text-gold transition-colors hover:border-gold/70"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {CONTACT.email}
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-[5px] border border-gold/40 font-mono text-xs font-semibold tabular-nums text-gold">
                      03
                    </span>
                    <small className="text-[11px] font-semibold ltr:uppercase ltr:tracking-[0.18em] rtl:tracking-normal text-cream/50">
                      {t.contact.details.office}
                    </small>
                  </div>
                  <div className="mt-3 space-y-3 ps-11">
                    <p className="flex items-start gap-2.5 text-sm leading-7 text-cream/70">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                      <span>
                        <span className="block font-bold text-cream">
                          {lang === "ar" ? CONTACT.addressAr : CONTACT.addressEn}
                        </span>
                        <span className="block">{lang === "ar" ? CONTACT.addressAr2 : CONTACT.addressEn2}</span>
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={CONTACT.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-[4px] bg-gold px-4 py-1.5 text-xs font-bold text-deep-2 transition-colors hover:brightness-110"
                      >
                        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.contact.details.mapsLabel}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal variant="left" delay={0.1}>
          <div className="relative h-full bg-card p-6 text-foreground sm:p-10">
            {done ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-black text-foreground">{f.successTitle}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{f.successBody}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
                  <a
                    href={`tel:${CONTACT.ashraf.tel}`}
                    dir="ltr"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 transition-colors hover:underline"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {CONTACT.ashraf.display}
                  </a>
                  <a
                    href={`tel:${CONTACT.khaled.tel}`}
                    dir="ltr"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 transition-colors hover:underline"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {CONTACT.khaled.display}
                  </a>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {lang === "ar" ? "بياناتك تُعامل بسرية" : "Your details stay private"}
                    </span>
                    <h3 className="mt-4 text-2xl font-black tracking-tight text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.sub}</p>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-accent text-accent-foreground sm:grid">
                    <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
                  </span>
                </div>

                <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
                  {/* Honeypot — visually removed from the page, still submitted by bots */}
                  <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="cf-website">Website</label>
                    <input
                      id="cf-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={set("website")}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cf-name" className="font-bold">
                        {f.name} <span className="text-gold-metallic">*</span>
                      </Label>
                      <Input
                        id="cf-name"
                        value={form.name}
                        onChange={set("name")}
                        placeholder={f.namePlaceholder}
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        aria-invalid={attentionField === "name"}
                        aria-describedby={attentionField === "name" ? "cf-name-error" : undefined}
                        className={cn(inputCls, attentionField === "name" && "border-gold bg-gold/5 ring-2 ring-gold/30")}
                      />
                      <FieldCue show={attentionField === "name"} id="cf-name-error">
                        {lang === "ar" ? "أكمل هذا الحقل" : "Complete this field"}
                      </FieldCue>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cf-phone" className="font-bold">
                        {f.phone} <span className="text-gold-metallic">*</span>
                      </Label>
                      <Input
                        id="cf-phone"
                        type="tel"
                        dir="ltr"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder={f.phonePlaceholder}
                        required
                        minLength={7}
                        maxLength={25}
                        autoComplete="tel"
                        aria-invalid={attentionField === "phone"}
                        aria-describedby={attentionField === "phone" ? "cf-phone-error" : undefined}
                        className={cn(inputCls, attentionField === "phone" && "border-gold bg-gold/5 ring-2 ring-gold/30")}
                      />
                      <p className="flex items-center gap-1.5 text-[11px] leading-5 text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0 text-gold-2" aria-hidden="true" />
                        {f.phoneHint}
                      </p>
                      <FieldCue show={attentionField === "phone"} id="cf-phone-error">
                        {lang === "ar" ? "أكمل رقم الهاتف هنا" : "Complete the phone number here"}
                      </FieldCue>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cf-email">{f.email}</Label>
                      <Input
                        id="cf-email"
                        type="email"
                        dir="ltr"
                        value={form.email}
                        onChange={set("email")}
                        placeholder={f.emailPlaceholder}
                        maxLength={160}
                        autoComplete="email"
                        aria-invalid={attentionField === "email"}
                        aria-describedby={attentionField === "email" ? "cf-email-error" : undefined}
                        className={cn(inputCls, attentionField === "email" && "border-gold bg-gold/5 ring-2 ring-gold/30")}
                      />
                      <FieldCue show={attentionField === "email"} id="cf-email-error">
                        {lang === "ar" ? "صحح البريد الإلكتروني هنا" : "Correct the email address here"}
                      </FieldCue>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cf-service">{f.service}</Label>
                      <Select
                        value={form.service}
                        onValueChange={(v) => {
                          setForm((p) => ({ ...p, service: v }));
                          if (attentionField === "service") {
                            setAttentionField(null);
                            setSubmitError(null);
                          }
                        }}
                      >
                      <SelectTrigger id="cf-service" aria-invalid={attentionField === "service"} aria-describedby={attentionField === "service" ? "cf-service-error" : undefined} className={cn("h-14 w-full rounded-none border-0 border-b-2 border-border/50 bg-transparent px-0 font-bold shadow-none focus-visible:border-gold focus-visible:ring-0 data-[state=open]:border-gold", attentionField === "service" && "border-gold bg-gold/5 ring-2 ring-gold/30")}>
                        <SelectValue placeholder={f.servicePlaceholder} />
                      </SelectTrigger>
                        <SelectContent>
                          {t.services.items.map((s) => (
                            <SelectItem key={s.key} value={s.title}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldCue show={attentionField === "service"} id="cf-service-error">
                        {lang === "ar" ? "اختر الخدمة من هنا" : "Choose a service here"}
                      </FieldCue>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="cf-message" className="font-bold">
                        {f.message} <span className="text-gold-metallic">*</span>
                      </Label>
                      {form.message.trim().length > 0 && form.message.trim().length < 5 && (
                        <span className="text-[11px] font-bold text-destructive/80" dir="ltr">
                          {form.message.trim().length}/5
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="cf-message"
                      value={form.message}
                      onChange={set("message")}
                      placeholder={f.messagePlaceholder}
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={5}
                      aria-invalid={attentionField === "message"}
                      aria-describedby={attentionField === "message" ? "cf-message-error" : undefined}
                      className={cn("min-h-32 resize-none border-b-2 border-t-0 border-x-0 border-border/50 bg-transparent px-0 py-3 text-sm text-foreground placeholder:font-medium placeholder:text-muted-foreground/60 shadow-none focus:border-b-2 focus:border-gold focus:ring-0 rounded-none", attentionField === "message" && "border-gold bg-gold/5 ring-2 ring-gold/30")}
                    />
                    <p className="text-[11px] leading-5 text-muted-foreground">
                      {lang === "ar" ? "5 أحرف على الأقل · حتى 2000 حرف" : "At least 5 characters · up to 2000"}
                    </p>
                    <FieldCue show={attentionField === "message"} id="cf-message-error">
                      {lang === "ar" ? "اكتب رسالتك هنا" : "Write your message here"}
                    </FieldCue>
                  </div>

                  {submitError ? (
                    <div
                      role="alert"
                       className="flex items-start gap-2.5 border-s-2 border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm font-medium leading-6 text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{submitError}</span>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={loading}
                     className={cn(
                       "h-14 w-full rounded-[4px] bg-gold-metallic text-base font-extrabold text-on-gold shadow-none transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
                     )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        {f.sending}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
                        {f.submit}
                      </>
                    )}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-gold-2" aria-hidden="true" />
                      {lang === "ar" ? "رد خلال يوم عمل" : "Reply within one business day"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-gold-2" aria-hidden="true" />
                      {lang === "ar" ? "بيانات آمنة وسرية" : "Private and secure"}
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export const Contact = ContactSection;
