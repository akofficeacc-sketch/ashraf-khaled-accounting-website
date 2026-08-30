import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "مكتب محاسبة أشرف منسي وخالد الصادق | Ashraf & Khaled Accounting Office",
  description:
    "مكتب محاسبة معتمد وخبير ضرائب في الإسكندرية ومصر — أشرف منسي وخالد الصادق. مسك دفاتر، ضرائب دخل وقيمة مضافة، تأسيس شركات، وفاتورة إلكترونية مع حاسبات ضرائب مجانية.",
  keywords: [
    "مكتب محاسبة",
    "محاسب قانوني الإسكندرية",
    "ضرائب مصر",
    "أشرف منسي",
    "خالد الصادق",
    "ضريبة القيمة المضافة",
    "الفاتورة الإلكترونية",
    "الإيصال الإلكتروني",
    "تأسيس شركات مصر",
    "حاسبة كسب العمل",
    "حاسبة ضريبة الدخل",
    "غرامة التأخير",
    "مصطفى كامل الإسكندرية",
    "accounting office Alexandria",
    "tax consultant Egypt",
    "Egyptian Tax Authority",
  ],
  authors: [{ name: "مكتب محاسبة أشرف منسي وخالد الصادق" }],
  openGraph: {
    title: "مكتب محاسبة أشرف منسي وخالد الصادق | محاسبون ومستشارو ضرائب",
    description:
      "وضوح في أرقامك وثقة في كل خطوة — خدمات محاسبية وضريبية وتأسيس شركات في الإسكندرية وكل محافظات مصر.",
    type: "website",
    locale: "ar_EG",
    siteName: "مكتب محاسبة أشرف منسي وخالد الصادق",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#101215" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AccountingService",
  name: "مكتب محاسبة أشرف منسي وخالد الصادق",
  alternateName: "Ashraf & Khaled Accounting Office",
  description:
    "مكتب محاسبة واستشارات ضريبية وتأسيس شركات ومسك دفاتر في الإسكندرية، مصر.",
  foundingDate: "2003",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5 شارع فيكتور عمانويل، مصطفى كامل - برج (جـ) شقة 403",
    addressLocality: "الإسكندرية",
    addressCountry: "EG",
  },
  telephone: ["+201224517437", "+201003879710"],
  email: "office2024main@gmail.com",
  areaServed: "EG",
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {/* Fonts load via CDN links (hoisted to <head> by React 19). */}
        {/* Offline? Browsers silently fall back to system fonts — the app always boots. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
