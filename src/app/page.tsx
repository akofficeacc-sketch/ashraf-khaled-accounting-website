"use client";

import { LangProvider } from "@/components/site/lang-provider";
import { Topbar, Header, Footer, BackToTop, StickyCta } from "@/components/site/chrome";
import { Hero, Trustbar } from "@/components/site/hero";
import { Services } from "@/components/site/services";
import { Calculators } from "@/components/site/tools";
import { EtaPanel } from "@/components/site/eta-panel";
import { Why, Process, Journey } from "@/components/site/why";
import { About } from "@/components/site/about";
import { Testimonials, Insights } from "@/components/site/proof";
import { Faq } from "@/components/site/faq";
import { CtaBanner, Contact } from "@/components/site/contact";
import { OfferPopup } from "@/components/site/offer-popup";

export default function Home() {
  return (
    <LangProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <Topbar />
        <Header />
        <main id="main-content">
          <Hero />
          <Trustbar />
          <Services />
          <Calculators />
          <EtaPanel />
          <Why />
          <Process />
          <Journey />
          <About />
          <Testimonials />
          <Insights />
          <Faq />
          <CtaBanner />
          <Contact />
        </main>
        <Footer />
        <StickyCta />
        <BackToTop />
        <OfferPopup />
      </div>
    </LangProvider>
  );
}
