export type Lang = "ar" | "en";

/** The office was established in 2003; this keeps its public experience claim current. */
export const OFFICE_ESTABLISHED_YEAR = 2003;

export function getOfficeExperienceYears(today = new Date()): number {
  return Math.max(0, today.getFullYear() - OFFICE_ESTABLISHED_YEAR);
}

/** Experience value interpolated into the marketing copy below. */
const YEARS = getOfficeExperienceYears();

/** Immutable office contact facts. */
export const CONTACT = {
  nameAr: "مكتب محاسبة أشرف منسي وخالد الصادق",
  nameEn: "Ashraf & Khaled Accounting Office",
  ashraf: {
    nameAr: "أشرف منسي",
    nameEn: "Ashraf Mansy",
    display: "+20 12 24517437",
    tel: "+201224517437",
    whatsapp: "https://wa.me/201224517437",
  },
  khaled: {
    nameAr: "خالد الصادق",
    nameEn: "Khaled El-Sadek",
    display: "+20 10 03879710",
    tel: "+201003879710",
    whatsapp: "https://wa.me/201003879710",
  },
  email: "office2024main@gmail.com",
  addressAr: "الإسكندرية - 5 شارع فيكتور عمانويل",
  addressAr2: "مصطفى كامل - برج (جـ) شقة 403",
  addressShortAr: "مصطفى كامل، الإسكندرية",
  addressEn: "Alexandria - 5 Victor Emmanuel St.",
  addressEn2: "Mustafa Kamel - Tower (C), Apt. 403",
  addressShortEn: "Mustafa Kamel, Alexandria",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=5+Victor+Emmanuel+Street+Mustafa+Kamel+Alexandria+Egypt",
} as const;

/**
 * Official Egyptian Tax Authority (مصلحة الضرائب المصرية) references.
 * Used by the VAT tools panel so visitors always see the official source
 * for laws, news and services. All URLs are HTTPS and hardcoded.
 */
export const ETA = {
  homeAr: "https://www.eta.gov.eg/ar/home",
  homeEn: "https://www.eta.gov.eg/en/home",
  newsAr: "https://www.eta.gov.eg/ar/news",
  newsEn: "https://www.eta.gov.eg/en/news",
  vatLawsAr: "https://www.eta.gov.eg/ar/content/qwanyn-aldrybt-ly-alqymt-almdaft",
  vatLawsEn: "https://www.eta.gov.eg/en/content/qwanyn-aldrybt-ly-alqymt-almdaft",
  incomeLawsAr: "https://www.eta.gov.eg/ar/content/qwanyn-aldrybt-ly-aldkhl",
  incomeLawsEn: "https://www.eta.gov.eg/en/content/qwanyn-aldrybt-ly-aldkhl",
  periodicBooksAr: "https://www.eta.gov.eg/ar/periodic-books-instruction/periodical-books",
  periodicBooksEn: "https://www.eta.gov.eg/en/periodic-books-instruction/periodical-books",
  einvoiceInquiryAr: "https://www.eta.gov.eg/ar/einvoice-inquiry",
  einvoiceInquiryEn: "https://www.eta.gov.eg/en/einvoice-inquiry",
} as const;

/**
 * Egyptian payroll-tax (كسب العمل) data — brackets per year, personal exemption,
 * social-insurance limits & rates. Sources: Law 175/2023 (FY2023 brackets),
 * Finance Laws for 2024+ (brackets widened), Social Insurance Law 148/2019.
 * Bracket format: cumulative upper bound + marginal rate (consecutive
 * equal-rate bands merged — mathematically identical).
 */
export const TAX_BRACKETS_BY_YEAR: Record<string, { upper: number; rate: number }[]> = {
  "2026": [
    { upper: 40_000, rate: 0 },
    { upper: 55_000, rate: 0.1 },
    { upper: 70_000, rate: 0.15 },
    { upper: 200_000, rate: 0.2 },
    { upper: 400_000, rate: 0.225 },
    { upper: 700_000, rate: 0.25 },
    { upper: Infinity, rate: 0.275 },
  ],
  "2025": [
    { upper: 40_000, rate: 0 },
    { upper: 55_000, rate: 0.1 },
    { upper: 70_000, rate: 0.15 },
    { upper: 200_000, rate: 0.2 },
    { upper: 400_000, rate: 0.225 },
    { upper: 700_000, rate: 0.25 },
    { upper: Infinity, rate: 0.275 },
  ],
  "2024": [
    { upper: 40_000, rate: 0 },
    { upper: 55_000, rate: 0.1 },
    { upper: 70_000, rate: 0.15 },
    { upper: 200_000, rate: 0.2 },
    { upper: 400_000, rate: 0.225 },
    { upper: 700_000, rate: 0.25 },
    { upper: Infinity, rate: 0.275 },
  ],
  "2023": [
    { upper: 30_000, rate: 0 },
    { upper: 45_000, rate: 0.1 },
    { upper: 60_000, rate: 0.15 },
    { upper: 200_000, rate: 0.2 },
    { upper: 400_000, rate: 0.225 },
    { upper: 600_000, rate: 0.25 },
    { upper: Infinity, rate: 0.275 },
  ],
};

export const TAX_YEARS = ["2026", "2025", "2024", "2023"] as const;

/** Hard ceiling shared by every calculator input (keeps arithmetic bounded). */
export const MAX_CALCULATION_AMOUNT = 1_000_000_000;

export type IncomeTaxBracket = { upper: number; rate: number };

export type IncomeTaxRuleSet = {
  /** Human-readable version so a future legal update is a data-only change. */
  version: string;
  effectiveFrom: string;
  sourceUrl: string;
  brackets: readonly IncomeTaxBracket[];
  /** For high earners, Egyptian rules remove the first bands from the calculation. */
  highIncomeSteps: readonly { above: number; skipBands: number }[];
};

const ASMA_INCOME_SOURCE = "https://asma-systems.com/others/tax/income";

/**
 * Versioned personal income-tax rules used by the income calculator.
 *
 * Keep this block intentionally data-only: when an official law changes, update
 * the bracket numbers/version/source here. Runtime code validates every value
 * before it can participate in a calculation; no remote code or untrusted JSON
 * is ever executed in the browser.
 */
export const INCOME_TAX_RULESETS_BY_YEAR: Record<string, IncomeTaxRuleSet> = {
  "2026": {
    version: "2026-law-7-2024",
    effectiveFrom: "2024-07-01",
    sourceUrl: ASMA_INCOME_SOURCE,
    brackets: [
      { upper: 30_000, rate: 0 },
      { upper: 45_000, rate: 0.1 },
      { upper: 60_000, rate: 0.15 },
      { upper: 200_000, rate: 0.2 },
      { upper: 400_000, rate: 0.225 },
      { upper: Infinity, rate: 0.25 },
    ],
    highIncomeSteps: [
      { above: 600_000, skipBands: 1 },
      { above: 700_000, skipBands: 2 },
      { above: 800_000, skipBands: 3 },
      { above: 900_000, skipBands: 4 },
    ],
  },
  "2025": {
    version: "2025-law-7-2024",
    effectiveFrom: "2024-07-01",
    sourceUrl: ASMA_INCOME_SOURCE,
    brackets: [
      { upper: 30_000, rate: 0 },
      { upper: 45_000, rate: 0.1 },
      { upper: 60_000, rate: 0.15 },
      { upper: 200_000, rate: 0.2 },
      { upper: 400_000, rate: 0.225 },
      { upper: Infinity, rate: 0.25 },
    ],
    highIncomeSteps: [
      { above: 600_000, skipBands: 1 },
      { above: 700_000, skipBands: 2 },
      { above: 800_000, skipBands: 3 },
      { above: 900_000, skipBands: 4 },
    ],
  },
  "2024": {
    version: "2024-law-7-2024",
    effectiveFrom: "2024-07-01",
    sourceUrl: ASMA_INCOME_SOURCE,
    brackets: [
      { upper: 30_000, rate: 0 },
      { upper: 45_000, rate: 0.1 },
      { upper: 60_000, rate: 0.15 },
      { upper: 200_000, rate: 0.2 },
      { upper: 400_000, rate: 0.225 },
      { upper: Infinity, rate: 0.25 },
    ],
    highIncomeSteps: [
      { above: 600_000, skipBands: 1 },
      { above: 700_000, skipBands: 2 },
      { above: 800_000, skipBands: 3 },
      { above: 900_000, skipBands: 4 },
    ],
  },
  "2023": {
    version: "2023-law-175-2023",
    effectiveFrom: "2023-07-01",
    sourceUrl: ASMA_INCOME_SOURCE,
    brackets: [
      { upper: 30_000, rate: 0 },
      { upper: 45_000, rate: 0.1 },
      { upper: 60_000, rate: 0.15 },
      { upper: 200_000, rate: 0.2 },
      { upper: 400_000, rate: 0.225 },
      { upper: 600_000, rate: 0.25 },
      { upper: Infinity, rate: 0.275 },
    ],
    highIncomeSteps: [],
  },
};

function isValidIncomeTaxBrackets(value: unknown): value is readonly IncomeTaxBracket[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return false;
  let previous = 0;
  return value.every((bracket, index) => {
    if (!bracket || typeof bracket.upper !== "number" || typeof bracket.rate !== "number") return false;
    const isFinalInfinity = index === value.length - 1 && bracket.upper === Infinity;
    if ((!isFinalInfinity && !Number.isFinite(bracket.upper)) || bracket.upper <= previous) return false;
    if (!Number.isFinite(bracket.rate) || bracket.rate < 0 || bracket.rate > 1) return false;
    previous = bracket.upper;
    return true;
  });
}

function freezeIncomeTaxRuleSet(ruleSet: IncomeTaxRuleSet): IncomeTaxRuleSet {
  const brackets = ruleSet.brackets.map((bracket) => Object.freeze({ ...bracket }));
  const highIncomeSteps = ruleSet.highIncomeSteps
    .filter((step) => Number.isFinite(step.above) && step.above >= 0 && Number.isInteger(step.skipBands) && step.skipBands >= 0)
    .sort((a, b) => a.above - b.above)
    .map((step) => Object.freeze({ ...step }));
  if (!isValidIncomeTaxBrackets(brackets)) {
    throw new Error(`Invalid income tax rules: ${ruleSet.version}`);
  }
  return Object.freeze({ ...ruleSet, brackets: Object.freeze(brackets), highIncomeSteps: Object.freeze(highIncomeSteps) });
}

const IMMUTABLE_INCOME_TAX_RULESETS = Object.freeze(
  Object.fromEntries(Object.entries(INCOME_TAX_RULESETS_BY_YEAR).map(([year, ruleSet]) => [year, freezeIncomeTaxRuleSet(ruleSet)]))
) as Record<string, IncomeTaxRuleSet>;

export function getIncomeTaxRuleSet(year = "2026"): IncomeTaxRuleSet {
  return IMMUTABLE_INCOME_TAX_RULESETS[year] ?? IMMUTABLE_INCOME_TAX_RULESETS["2026"];
}

/** Returns a defensive copy so callers cannot mutate the live rule table. */
export function getIncomeTaxBrackets(year = "2026", annual = 0): IncomeTaxBracket[] {
  const ruleSet = getIncomeTaxRuleSet(year);
  const safeAnnual = Number.isFinite(annual) && annual > 0 ? Math.min(annual, MAX_CALCULATION_AMOUNT) : 0;
  const skipBands = ruleSet.highIncomeSteps.reduce(
    (skip, step) => (safeAnnual > step.above ? Math.max(skip, step.skipBands) : skip),
    0
  );
  return ruleSet.brackets.slice(skipBands).map((bracket) => ({ ...bracket }));
}

/** Annual personal exemption (الإعفاء الشخصي) — Law 175/2023+. */
export const PERSONAL_EXEMPTION = 20_000;

/** Social-insurance subscription limits per year (monthly EGP). */
export const INSURANCE_LIMITS: Record<string, { min: number; max: number }> = {
  "2026": { min: 2_700, max: 16_700 },
  "2025": { min: 2_300, max: 14_500 },
  "2024": { min: 2_000, max: 12_600 },
  "2023": { min: 1_700, max: 10_900 },
};

export const INSURANCE_EMPLOYEE_RATE = 0.11;
export const INSURANCE_EMPLOYER_RATE = 0.1875;
/** Exempt allowances are capped at 30% of the wage for insurance purposes. */
export const ALLOWANCE_EXEMPT_CAP = 0.3;

export const VAT_RATE = 0.14;

/* ------------------------- income-tax (افراد / شركات) ------------------------ */

/** Company (legal person) flat income-tax rate — Law 91/2005 art. 50. */
export const CORPORATE_TAX_RATE = 0.225;

/* --------------------- VAT additional fine (الضريبة الاضافية) --------------------- */

/**
 * VAT examination-difference additional tax (المادة 35/1 القيمة المضافة):
 * - Part 1: 1.5% per month from the end of the tax period until notification
 *   (تاريخ الإخطار من المأمورية), capped at 36 months.
 * - Part 2: 1.5% per month from notification until payment (no cap).
 * A partial month is counted as a full month.
 */
export const VAT_FINE_MONTHLY_RATE = 0.015;
export const VAT_FINE_CAP_MONTHS = 36;

/* ------------------------ delay fine (غرامة التأخير) ------------------------ */

/**
 * Income-tax delay compensation (مقابل التأخير — Law 91/2005 art. 110):
 * yearly rate = central-bank open-market discount rate + 2%.
 * The table below follows the rates applied by the Egyptian Tax Authority
 * (same series used by ASMA Systems' calculator) per calendar year.
 */
export const DELAY_FINE_RATES: Record<number, number> = {
  2016: 0.1175,
  2017: 0.1725,
  2018: 0.2125,
  2019: 0.1925,
  2020: 0.1475,
  2021: 0.1075,
  2022: 0.1075,
  2023: 0.1875,
  2024: 0.2175,
  2025: 0.2975,
  // 2026 rate not yet announced by the Tax Authority — accrual pauses at 0%.
  2026: 0,
};

/** Fine starts accruing from: individuals — April 1, companies — May 1 (following the tax year). */
export const DELAY_FINE_START_MONTH_DAY = {
  individual: { month: 3, day: 1 }, // April 1 (0-based month)
  company: { month: 4, day: 1 }, // May 1 (0-based month)
} as const;

export type DelayFineEntry = {
  id: string;
  year: number;
  amount: number;
};

export type DelayFineRow = {
  periodStart: string;
  months: number;
  rate: number;
  entryAmount: number;
  balance: number;
  fine: number;
};

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * ASMA-style delay-fine engine (غرامة التأخير):
 * - Entries sorted by tax year; running balance grows at each entry's start
 *   date (May 1 for companies / April 1 for individuals following the tax year).
 * - The whole timeline is segmented by calendar year AND entry boundaries —
 *   when a new difference starts mid-year, the year is split so the new
 *   balance only accrues from its own start date.
 * - Months = full calendar months elapsed (partial month excluded per
 *   استبعاد كسر الشهر، as applied by the Tax Authority).
 * - fine_segment = balance × rate × months / 12 (exact, 2-decimal money;
 *   the grand total is rounded to the nearest piaster and the piastre
 *   fraction of the balance itself is floored).
 */
export function computeDelayFine(
  entries: DelayFineEntry[],
  paymentDate: Date,
  entityType: "individual" | "company"
): { rows: DelayFineRow[]; totalFine: number; totalBalance: number } {
  if (!Array.isArray(entries) || !(paymentDate instanceof Date) || Number.isNaN(paymentDate.getTime())) {
    return { rows: [], totalFine: 0, totalBalance: 0 };
  }

  const validEntityType = entityType === "individual" ? "individual" : "company";
  const sorted = [...entries]
    .filter((e) => e && typeof e.amount === "number" && Number.isFinite(e.amount) && e.amount > 0 && typeof e.year === "number" && e.year >= 2016 && e.year <= 2035)
    .sort((a, b) => a.year - b.year);

  if (sorted.length === 0) {
    return { rows: [], totalFine: 0, totalBalance: 0 };
  }

  const rows: DelayFineRow[] = [];
  let balance = 0;
  let totalFine = 0;

  const startAnchor = DELAY_FINE_START_MONTH_DAY[validEntityType];

  type Boundary = { date: Date; addAmount: number; entryAmount: number; entryYear: number };
  const boundaries: Boundary[] = sorted.map((e) => ({
    date: new Date(e.year + 1, startAnchor.month, startAnchor.day),
    addAmount: Math.floor(e.amount),
    entryAmount: e.amount,
    entryYear: e.year,
  }));

  // Max 50 boundaries to bound execution
  const maxBoundaries = Math.min(boundaries.length, 50);

  for (let b = 0; b < maxBoundaries; b++) {
    const boundary = boundaries[b];
    if (!boundary) continue;
    balance += boundary.addAmount;
    const nextBoundary = boundaries[b + 1]?.date ?? null;
    const windowEnd = nextBoundary && nextBoundary < paymentDate ? nextBoundary : paymentDate;

    if (paymentDate <= boundary.date) {
      rows.push({
        periodStart: fmtDate(boundary.date),
        months: 0,
        rate: DELAY_FINE_RATES[boundary.date.getFullYear()] ?? 0,
        entryAmount: boundary.entryAmount,
        balance,
        fine: 0,
      });
      continue;
    }

    // segment this entry's window by calendar year with loop safety
    let cursor = new Date(boundary.date);
    let iterations = 0;
    const MAX_SEGMENT_ITERATIONS = 120; // 10 years max segments

    while (cursor < windowEnd && iterations < MAX_SEGMENT_ITERATIONS) {
      iterations += 1;
      const rateYear = cursor.getFullYear();
      const rate = DELAY_FINE_RATES[rateYear] ?? 0;
      const yearEnd = new Date(rateYear + 1, 0, 1);
      const segmentEnd = windowEnd < yearEnd ? windowEnd : yearEnd;
      if (segmentEnd <= cursor) break;

      let months =
        (segmentEnd.getFullYear() - cursor.getFullYear()) * 12 +
        (segmentEnd.getMonth() - cursor.getMonth());
      if (segmentEnd.getDate() < cursor.getDate()) months -= 1;
      months = Math.max(0, months);

      if (months === 0) {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        continue;
      }

      const fine = Math.round(((balance * rate * months) / 12) * 100) / 100;
      totalFine += fine;
      rows.push({
        periodStart: fmtDate(cursor),
        months,
        rate,
        entryAmount: 0,
        balance,
        fine,
      });
      cursor = yearEnd;
    }
  }

  return {
    rows,
    totalFine: Math.round(totalFine * 100) / 100,
    totalBalance: balance,
  };
}

export function computeIncomeTax(annual: number, year = "2026"): number {
  if (typeof annual !== "number" || !Number.isFinite(annual) || annual <= 0) {
    return 0;
  }
  const safeAnnual = Math.min(annual, MAX_CALCULATION_AMOUNT);
  const brackets = TAX_BRACKETS_BY_YEAR[year] ?? TAX_BRACKETS_BY_YEAR["2026"] ?? [];
  let tax = 0;
  let previous = 0;

  for (const bracket of brackets) {
    if (safeAnnual <= previous) break;
    const upper = Number.isFinite(bracket.upper) ? bracket.upper : safeAnnual;
    const taxable = Math.max(0, Math.min(safeAnnual, upper) - previous);
    tax += taxable * bracket.rate;
    previous = upper;
  }
  return Math.max(0, Math.round(tax * 100) / 100);
}

/**
 * Personal income-tax calculator backed by the versioned ASMA rule set.
 * The input is bounded and the result is rounded once at the money boundary.
 */
export function computePersonalIncomeTax(annual: number, year = "2026"): number {
  if (typeof annual !== "number" || !Number.isFinite(annual) || annual <= 0) return 0;
  const safeAnnual = Math.min(annual, MAX_CALCULATION_AMOUNT);
  const brackets = getIncomeTaxBrackets(year, safeAnnual);
  let tax = 0;
  let previous = 0;

  for (const bracket of brackets) {
    if (safeAnnual <= previous) break;
    const upper = Number.isFinite(bracket.upper) ? bracket.upper : safeAnnual;
    const taxable = Math.max(0, Math.min(safeAnnual, upper) - previous);
    tax += taxable * bracket.rate;
    previous = upper;
  }

  return Math.max(0, Math.round(tax * 100) / 100);
}

export type ServiceKey =
  | "bookkeeping"
  | "vat"
  | "returns"
  | "audit"
  | "setup"
  | "einvoice"
  | "payroll"
  | "advisory";


export const content: Record<Lang, Content> = {
  ar: {
    dir: "rtl",
    localeDigits: "en-US",
    currency: "ج.م",
    topbar: {
      location: "مصطفى كامل، الإسكندرية",
    },
    nav: {
      services: "الخدمات",
      why: "لماذا نحن",
      about: "عن الشركة",
      contact: "تواصل معنا",
      cta: "تحدث مع مستشار",
      menu: "القائمة",
      themeLight: "الوضع الفاتح",
      themeDark: "الوضع الداكن",
      switchLang: "Switch language",
      skip: "تخطّى إلى المحتوى الرئيسي",
    },
    hero: {
      eyebrow: "المحاسبة والضرائب ودعم الأعمال — الإسكندرية وكل مصر",
      title: "وضوح في أرقامك، وثقة في كل خطوة.",
      lead: "مكتب أشرف منسي وخالد الصادق — محاسبة وضرائب ومسك دفاتر وتأسيس شركات بفريق واحد سريع الاستجابة، يرافقك من أول مستند حتى آخر إقرار.",
      ctaPrimary: "تحدث مع مستشار",
      ctaSecondary: "استكشف الخدمات",
      chips: ["محاسبة", "ضرائب", "رواتب", "تأسيس شركات"],
      dashboard: {
        brand: "AK OFFICE",
        brandSub: "مكتبك للامتثال في الإسكندرية",
        live: "LIVE",
        statusLabel: "الوضع الحالي",
        statusValue: "السجلات منظمة",
        ready: "READY",
        progressLabel: "الأولوية التالية",
        progressValue: "الاستعداد للإقرار الضريبي",
        progressPct: 82,
        steps: ["مسك الدفاتر", "إقرارات الضرائب", "تقارير مالية"],
        floatTopTitle: "القيمة المضافة 14%",
        floatTopSub: "الإقرار جاهز للتقديم",
        floatBottomTitle: "تقارير أوضح",
        floatBottomSub: "قرارات أفضل",
      },
    },
    metrics: [
      { value: `+${YEARS}`, label: "سنة خبرة في المحاسبة والضرائب" },
      { value: "+350", label: "عميل وشركة نخدمها حاليًا" },
      { value: "2", label: "شريكان مؤسسان يتابعان كل ملف" },
      { value: "مصر", label: "تغطية لجميع المحافظات — حضوريًا وعن بُعد" },
    ],
    trust: [
      { icon: "badge", text: "محاسبون متخصصون بخبرة موثقة" },
      { icon: "lock", text: "سرية وأمانة تامة في البيانات" },
      { icon: "invoice", text: "فاتورة إلكترونية ومستمركة" },
      { icon: "clock", text: "متابعة مواعيد الضرائب بلا غرامات" },
      { icon: "chat", text: "دعم مباشر عبر واتساب" },
    ],
    services: {
      eyebrow: "خدماتنا",
      title: "شريك موثوق لكل مرحلة من مراحل أعمالك",
      sub: "من أول قيد محاسبي حتى الإقرار الضريبي السنوي — ننسّق كل خدمة بما يتوافق مع نشاطك والتزاماتك في مصر.",
      filters: [
        { key: "all", label: "كل الخدمات" },
        { key: "accounting", label: "محاسبة" },
        { key: "tax", label: "ضرائب" },
        { key: "audit", label: "مراجعة" },
        { key: "companies", label: "شركات" },
        { key: "other", label: "أخرى" },
      ],
      discuss: "ناقش هذه الخدمة",
      items: [
        {
          key: "bookkeeping",
          cat: "accounting",
          icon: "book",
          title: "المحاسبة ومسك الدفاتر",
          desc: "القيود اليومية ودفاتر الأستاذ والتسويات البنكية والتقارير الدورية وإقفال نهاية السنة.",
        },
        {
          key: "vat",
          cat: "tax",
          icon: "percent",
          title: "ضريبة القيمة المضافة",
          desc: "التسجيل والإقرارات الشهرية والربعية والمستندات الدامرة ومتابعة المنظومة الإلكترونية.",
        },
        {
          key: "returns",
          cat: "tax",
          icon: "file",
          title: "الإقرارات الضريبية وكسب العمل",
          desc: "إقرار كسب العمل والدمغة وربط الأرباح ومتابعة مواعيد مصلحة الضرائب المصرية.",
        },
        {
          key: "audit",
          cat: "audit",
          icon: "check",
          title: "المراجعة وتدقيق الحسابات",
          desc: "مراجعة مستقلة وتجهيز القوائم المالية وفق المعايير المصرية ودعم أعمال الفحص.",
        },
        {
          key: "setup",
          cat: "companies",
          icon: "building",
          title: "تأسيس الشركات والسجل التجاري",
          desc: "التأسيس والتعديل والتجديد والاشتراكات الحكومية والبطاقة الضريبية.",
        },
        {
          key: "einvoice",
          cat: "other",
          icon: "invoice",
          title: "الفاتورة الإلكترونية والإيصال الإلكتروني",
          desc: "التسجيل في منظومة الفاتورة الإلكترونية وإصدار الفواتير المتوافقة وتدريب فريقك.",
        },
        {
          key: "payroll",
          cat: "accounting",
          icon: "wallet",
          title: "الرواتب وكشوف الأجور",
          desc: "إعداد كشوف المرتبات وضريبة كسب العمل والتأمينات الاجتماعية شهريًا.",
        },
        {
          key: "advisory",
          cat: "companies",
          icon: "trending",
          title: "الاستشارات المالية والدعم البنكي",
          desc: "دراسات مالية وملفات بنكية وفتح حسابات الشركات وتقييم الأوضاع قبل التوسع.",
        },
      ],
    },
    why: {
      eyebrow: "لماذا مكتبنا",
      title: "صمّمنا خدماتنا لأصحاب الأعمال الذين يريدون إجابات واضحة",
      copy: "تحصل على مسؤول واضح وتقدم موثّق وفريق يفهم العلاقة بين المحاسبة والضرائب والسجل التجاري والتعاملات البنكية — كي لا تقع بين الجهات.",
      cardLocation: "من الإسكندرية إلى جميع محافظات مصر",
      cardYears: `+${YEARS}`,
      cardYearsLabel: "سنة خبرة",
      cardStats: [
        { value: "27", label: "محافظة مصرية نغطيها", icon: "map" },
        { value: "8", label: "خدمات متخصصة تحت سقف واحد", icon: "layers" },
        { value: "4", label: "حاسبات ضريبية مجانية", icon: "calculator" },
      ],
      benefits: [
        { n: "01", title: "فريق واحد مسؤول", desc: "جهة اتصال واحدة للمحاسبة والضرائب والشركات." },
        { n: "02", title: "نطاق ومواعيد واضحة", desc: "تعرف المطلوب، وتكلفته، وما الخطوة التالية." },
        { n: "03", title: "تنفيذ قائم على الامتثال", desc: "سجلات منظمة وجاهزة لأي فحص في أي وقت." },
        { n: "04", title: "دعم سريع داخل مصر", desc: "تواصل مباشر مع الشركاء ومتابعة حتى الإنجاز." },
      ],
    },
    testimonials: {
      eyebrow: "آراء العملاء",
      title: "موثوق به من شركات وأنشطة في مختلف المحافظات",
      sub: "ملاحظات حقيقية من عملاء ندعمهم في المحاسبة والضرائب والخدمات المؤسسية.",
      items: [
        {
          quote: "أعادوا هيكلة محاسبتنا خلال أسابيع. لأول مرة نقدم الإقرار الضريبي قبل موعده بوقت كافٍ.",
          name: "محمد عبد الرحمن",
          role: "مدير مالي — شركة تجارية، الإسكندرية",
          initials: "م ع",
        },
        {
          quote: "تولّوا تسجيل ضريبة القيمة المضافة والفاتورة الإلكترونية بالكامل. التزام تام دون أن أتابعهم.",
          name: "نهى سمير",
          role: "مؤسِّسة — متجر إلكتروني، الإسكندرية",
          initials: "ن س",
        },
        {
          quote: "فريق واحد للمحاسبة والضرائب والرواتب. توقفت أخيرًا عن مطاردة أكثر من جهة في آن واحد.",
          name: "عمرو الشاذلي",
          role: "صاحب مصنع — العاشر من رمضان",
          initials: "ع ش",
        },
        {
          quote: "سريعون ومنظمون ومفيدون حقًا. الاستشارة الأولى وحدها وفّرت علينا أسابيع من المراسلات.",
          name: "داليا فؤاد",
          role: "مديرة عمليات — مجموعة عيادات، الإسكندرية",
          initials: "د ف",
        },
      ],
    },
    calc: {
      eyebrow: "أدوات مجانية 100%",
      title: "حاسبات الضرائب المصرية",
      sub: "أربع أدوات احترافية مجانية — كسب العمل، ضريبة الدخل، الضريبة الإضافية، وغرامة التأخير — بنفس منهجية مصلحة الضرائب.",
      tabs: {
        payroll: "كسب العمل (المرتبات)",
        income: "ضريبة الدخل",
        vatFine: "الضريبة الإضافية",
        delayFine: "غرامة التأخير",
      },
      payroll: {
        modeMonthly: "إدخال شهري",
        modeAnnual: "إدخال سنوي",
        yearLabel: "السنة الضريبية",
        wageLabel: "الأجر",
        wagePlaceholder: "مثال: 7,000",
        deductionsLabel: "خصومات أخرى",
        deductionsHint: "استقطاعات لا تدخل في التأمينات",
        allowancesLabel: "بدلات معفاة من التأمينات",
        allowancesHint: "بحد أقصى 30% من الأجر التأميني",
        insuranceSwitch: "احتسب التأمينات الاجتماعية",
        exemptionLabel: "الإعفاء الشخصي السنوي",
        limitsLabel: "حدود الاشتراك التأميني",
        netMonthlyLabel: "صافي المرتب الشهري",
        monthlyTaxLabel: "الضريبة شهريًا",
        annualTaxLabel: "الضريبة سنويًا",
        insuranceMonthlyLabel: "التأمينات شهريًا",
        annualWageLabel: "الأجر السنوي",
        taxBaseLabel: "وعاء الضريبة السنوي",
        empty: "أدخل الأجر لبدء الحساب",
        insuranceTitle: "التأمينات الاجتماعية",
        insurableWage: "الأجر التأميني",
        employeeShare: "حصة الموظف (11%)",
        employerShare: "حصة الشركة (18.75%)",
        monthlyCol: "شهري",
        annualCol: "سنوي",
        bracketsTitle: "شرائح الضريبة",
        colBand: "الشريحة",
        colRate: "النسبة",
        colTax: "الضريبة",
        colNet: "الصافي",
        totalRow: "الإجمالي",
      },
      income: {
        individual: "أفراد (أشخاص طبيعية)",
        company: "شركات (أشخاص اعتبارية)",
        yearLabel: "السنة الضريبية",
        netIncomeLabel: "صافي الدخل السنوي",
        netIncomePlaceholder: "مثال: 500,000",
        resultLabel: "الضريبة السنوية",
        netAfterLabel: "صافي الدخل بعد الضريبة",
        effectiveRateLabel: "السعر الفعلي",
        empty: "أدخل صافي الدخل لبدء الحساب",
        companyNote: "ضريبة الشركات 22.5% موحدة على صافي الربح",
        bracketsTitle: "شرائح الضريبة",
        colBand: "الشريحة",
        colRate: "النسبة",
        colTax: "الضريبة",
        colNet: "الصافي",
        totalRow: "الإجمالي",
      },
      etaPanel: {
        badge: "مصدر رسمي — مباشر",
        title: "مستجدات مصلحة الضرائب المصرية",
        subtitle: "آخر الأخبار والتعليمات من الموقع الرسمي لمصلحة الضرائب — نستعرضها لك لحظة بلحظة",
        newsTitle: "أحدث الأخبار",
        lawsTitle: "القوانين والخدمات الرسمية",
        viewAll: "كل الأخبار والمستجدات",
        lastUpdated: "آخر تحديث",
        refresh: "تحديث",
        refreshing: "جارٍ التحديث…",
        loading: "جارٍ تحميل المستجدات من المصلحة…",
        offline: "تعذر جلب المستجدات الآن — يمكنك الاطلاع عليها مباشرة على موقع المصلحة",
        vatLaws: "قوانين الضريبة على القيمة المضافة",
        incomeLaws: "قوانين الضريبة على الدخل",
        periodicBooks: "كتب دورية وتعليمات",
        einvoice: "استعلام الفاتورة الإلكترونية",
        home: "الموقع الرسمي للمصلحة",
        sourceNote: "جميع الروابط تفضي إلى الموقع الرسمي eta.gov.eg",
        translatedNote: "عند العرض بالإنجليزية تُترجَم العناوين آليًا من المصدر العربي الكامل، وتفضي الروابط إلى المقال الأصلي",
      },
      vatFine: {
        periodLabel: "نهاية الفترة الضريبية",
        amountLabel: "صافي فرق فحص الضريبة",
        amountPlaceholder: "مثال: 5,000",
        noticeLabel: "تاريخ الإخطار من المأمورية",
        paymentLabel: "تاريخ السداد",
        part1Title: "1.5% عن كل شهر بحد أقصى 36 شهر (3 سنوات)",
        part1From: "بداية الحساب",
        part1Months: "عدد الشهور",
        part1Fine: "الغرامة",
        part2Title: "1.5% عن كل شهر من تاريخ الإخطار حتى تاريخ السداد",
        part2From: "تاريخ الإخطار",
        part2To: "تاريخ السداد",
        part2Months: "عدد الشهور",
        part2Fine: "الغرامة",
        totalLabel: "الإجمالي",
        empty: "أدخل المبلغ والتواريخ لحساب الضريبة الإضافية",
        note: "تحسب الضريبة الإضافية على فروق فحص القيمة المضافة وفق المادة (35) — كسر الشهر يحسب شهرًا كاملًا.",
      },
      delayFine: {
        entityLabel: "المنشأة",
        individual: "فردي",
        company: "شركة",
        paymentLabel: "تاريخ السداد النهائي",
        addEntryTitle: "إضافة فرق فحص",
        yearLabel: "السنة الضريبية",
        amountLabel: "صافي فرق الفحص",
        amountPlaceholder: "مثال: 50,000",
        addBtn: "إضافة",
        removeBtn: "حذف",
        clearAll: "حذف الكل",
        empty: "أضف فرق فحص واحدًا على الأقل لحساب الغرامة",
        colStart: "بداية الفترة",
        colMonths: "شهور",
        colRate: "الفائدة",
        colEntry: "فرق فحص/سداد",
        colBalance: "مجموع الفروق",
        colFine: "الغرامة",
        totalRow: "الإجمالي",
        totalFineLabel: "إجمالي الغرامة",
        balanceLabel: "إجمالي الفروق",
        note: "غرامة التأخير = سعر الخصم المقرر في السوق المفتوح + 2% سنويًا، وتبدأ من أول أبريل للفرد وأول مايو للشركات، مع استبعاد كسر الشهر والجنيه.",
      },
      disclaimer:
        "الحاسبات مبنية على قوانين الضرائب المصرية المعمول بها (91/2005، 175/2023، القيمة المضافة 67/2016) ونسبة القيمة المضافة 14% — النتائج استرشادية وقد تنطبق معاملات خاصة على حالتك.",
      cta: "تحدث مع مستشار",
    },
    process: {
      eyebrow: "طريق أبسط للإنجاز",
      title: "من المحادثة الأولى حتى إتمام الخدمة",
      steps: [
        { n: "01", title: "الفهم", desc: "نراجع نشاطك وأهدافك ومواعيدك." },
        { n: "02", title: "التخطيط", desc: "تحصل على نطاق وجدول زمني واضح." },
        { n: "03", title: "التنفيذ", desc: "نعدّ المستندات ونقدّم الإقرارات." },
        { n: "04", title: "الدعم", desc: "ننظم السجلات ونوجّه الخطوة التالية." },
      ],
    },
    about: {
      eyebrow: "عن المكتب",
      title: "استشارة عملية وتنفيذ دقيق، دون تعقيد غير ضروري.",
      copy: "نساعد أصحاب الأعمال والأنشطة الناشئة والقائمة على اتخاذ قراراتهم المالية والضريبية بثقة. يجمع أسلوبنا بين خبرة المحاسبة المصرية والانضباط في التوثيق والامتثال — بأثر مكتوب واضح في كل خطوة.",
      cta: "تحدث مع مستشار",
      asideTitle: `بقيادة شريكين يجمعان خبرة تتجاوز ${YEARS} عامًا في المحاسبة والضرائب`,
      asideCopy:
        "نؤمن أن العلاقة الطويلة تبدأ من سجلات منظمة، وإقرارات في مواعيدها، ووضوح كامل في الرسوم والنطاق قبل البدء.",
      chips: ["محاسبة", "ضرائب", "شركات", "امتثال"],
      teamEyebrow: "القيادة",
      teamTitle: "الفريق وراء المكتب",
      members: [
        {
          name: "أشرف منسي",
          role: "شريك مؤسس",
          spec: "المحاسبة والضرائب · الإقرارات · مسك الدفاتر",
          initials: "أ م",
          phone: CONTACT.ashraf.display,
          tel: CONTACT.ashraf.tel,
          whatsapp: CONTACT.ashraf.whatsapp,
          call: "اتصل بأشرف",
          whatsappLabel: "واتساب",
        },
        {
          name: "خالد الصادق",
          role: "شريك مؤسس",
          spec: "المراجعة · تأسيس الشركات · الاستشارات",
          initials: "خ ص",
          phone: CONTACT.khaled.display,
          tel: CONTACT.khaled.tel,
          whatsapp: CONTACT.khaled.whatsapp,
          call: "اتصل بخالد",
          whatsappLabel: "واتساب",
        },
      ],
    },
    journey: {
      eyebrow: "رحلة العميل",
      title: "كيف تتطور علاقتنا بعملائنا",
      sub: "من أول اجتماع حتى التقارير الدورية — منهجية واضحة تحوّل المستندات المبعثرة إلى قرارات واثقة.",
      milestones: [
        {
          tag: "الخطوة 1",
          title: "جلسة تعارف وفهم",
          desc: "نستمع لأهدافك ووضعك الحالي ونراجع المستندات المتاحة — بلا أي التزام عليك.",
        },
        {
          tag: "الخطوة 2",
          title: "ترتيب المستندات والدفاتر",
          desc: "نبني قاعدة سجلات سليمة: قيود منظمة، ملفات ضريبية مرتبة، ومسار واضح للأوراق.",
        },
        {
          tag: "الخطوة 3",
          title: "التسجيلات والإقرارات في مواعيدها",
          desc: "نتولى التسجيلات الضريبية والإقرارات الدورية — لا غرامات تأخير ولا مفاجآت.",
        },
        {
          tag: "الخطوة 4",
          title: "تقارير تفهمها وتفيدك",
          desc: "تقارير دورية بلغة واضحة: أين تقف الآن، وما الذي يستحق الانتباه أولًا.",
        },
        {
          tag: "الخطوة 5",
          title: "توسّع بثقة",
          desc: "نخطط معك للخطوة التالية: تمويل، توسع، أو هيكل جديد — بأرقام مؤكدة لا تخمين.",
        },
      ],
    },
    faq: {
      eyebrow: "الأسئلة الشائعة",
      title: "إجابات مفيدة قبل أن تبدأ",
      contactLink: "تحدث مع مستشار",
      searchPlaceholder: "ابحث في الأسئلة…",
      searchLabel: "تصفية الأسئلة",
      noResults: "لا توجد نتائج مطابقة — جرّب كلمة أخرى أو تواصل معنا مباشرة.",
      items: [
        {
          q: "هل تقدمون خدماتكم خارج الإسكندرية؟",
          a: "نعم، نخدم عملاءنا في جميع محافظات مصر — حضوريًا حيث يلزم، وعن بُعد عبر التواصل الرقمي ومشاركة المستندات الإلكترونية.",
        },
        {
          q: "هل تعملون مع الأفراد والشركات معًا؟",
          a: "نعم، نخدم أصحاب المهن الحرة والشركات الفردية وشركات الأشخاص والأموال — لكل فئة نطاق خدمات ورسوم مناسبان.",
        },
        {
          q: "هل فريق واحد يدير كل الخدمات؟",
          a: "نعم، منسق حساب واحد يتابع المحاسبة والضرائب والسجل التجاري لضمان توافق المستندات والمواعيد في ملف واحد.",
        },
        {
          q: "كيف تتم الاستشارة الأولى؟",
          a: "نراجع نشاطك ومستنداتك ومواعيدك، ثم نقدم نطاقًا واضحًا والخطوات التالية والرسوم — قبل أي التزام منك.",
        },
        {
          q: "هل تتعاملون مع الفاتورة الإلكترونية والإيصال الإلكتروني؟",
          a: "نعم، نسجّل نشاطك في المنظومة، ونجهّز إصدار الفواتير المتوافقة، وندرّب فريقك على الاستخدام اليومي الصحيح.",
        },
        {
          q: "ماذا أحتاج لبدء التعاون؟",
          a: "آخر ميزانية وإقرارات سابقة إن وُجدت، وصور المستندات الأساسية للنشاط — ونرشدك خطوة بخطوة لما ينقص.",
        },
      ],
    },
    insights: {
      eyebrow: "مقالات",
      title: "إرشادات عملية لأعمال في مصر",
      sub: "تحديثات واضحة وقابلة للتنفيذ حول الضرائب والمحاسبة والامتثال — يكتبها فريق المكتب.",
      readMore: "اطلب استشارة",
      items: [
        {
          icon: "invoice",
          cat: "فواتير",
          title: "الفاتورة الإلكترونية والإيصال الإلكتروني: ما الذي يحتاجه نشاطك في 2025",
          desc: "نظرة عملية على مراحل التطبيق والفئات المستهدفة وما يجب تجهيزه قبل التسجيل.",
          date: "يناير 2025",
          read: "6 دقائق قراءة",
        },
        {
          icon: "percent",
          cat: "ضرائب",
          title: "تسجيل ضريبة القيمة المضافة: متى يصبح إلزاميًا؟",
          desc: "إذا تجاوزت مبيعاتك 500,000 ج.م سنويًا قد يصبح التسجيل واجبًا — إليك العملية والبدائل.",
          date: "ديسمبر 2024",
          read: "4 دقائق قراءة",
        },
        {
          icon: "building",
          cat: "تأسيس",
          title: "تأسيس شركة في مصر: خطوات عملية عبر الهيئة العامة للاستثمار",
          desc: "اختيار الشكل القانوني والسجل التجاري والبطاقة الضريبية — مقارنة سريعة قبل البدء.",
          date: "نوفمبر 2024",
          read: "7 دقائق قراءة",
        },
        {
          icon: "file",
          cat: "ضرائب",
          title: "الإقرار السنوي: جدول زمني عملي للاستعداد",
          desc: "لا تنتظر آخر لحظة — خطة شهرية لتجهيز الإقرار دون ضغط ولا أخطاء.",
          date: "أكتوبر 2024",
          read: "5 دقائق قراءة",
        },
        {
          icon: "wallet",
          cat: "رواتب",
          title: "كشوف الرواتب وكسب العمل: دليل صاحب العمل السريع",
          desc: "الشرائح الجديدة واحتساب الضريبة والتأمينات — بأمثلة رقمية مبسطة.",
          date: "سبتمبر 2024",
          read: "4 دقائق قراءة",
        },
        {
          icon: "trending",
          cat: "إدارة",
          title: "محاسب داخلي أم مكتب خارجي؟ كيف تختار؟",
          desc: "مقارنة تكلفة وتحكم وسرية بين الخيارين — ولماذا يختار كثيرون الاثنين معًا.",
          date: "أغسطس 2024",
          read: "6 دقائق قراءة",
        },
      ],
    },
    offerPopup: {
      badge: "عرض لفترة محدودة",
      title: "استشارة ضريبية أولى مجانية",
      copy: "15 دقيقة مع شريك المكتب لمراجعة وضعك وخطة العمل القادمة — بلا التزام.",
      cta: "احجز استشارتك المجانية",
      close: "إغلاق",
      a11yLabel: "عرض استشارة مجانية",
    },
    etaSection: {
      eyebrow: "بوابة الضرائب الرسمية",
      title: "أخبار وتشريعات مصلحة الضرائب المصرية",
      sub: "تابع آخر مستجدات الضرائب في مصر لحظة بلحظة — أخبار المصلحة، القوانين والتشريعات الضريبية، الكتب الدورية والتعليمات — من الموقع الرسمي eta.gov.eg مباشرة، مع قراءة مكتب محاسبة أشرف منسي وخالد الصادق لما يهم منشأتك.",
      seoCopy1:
        "نرصد لك مستجدات مصلحة الضرائب المصرية أولاً بأول: تعديلات قوانين الضريبة على الدخل والقيمة المضافة، التعليمات التنفيذية، مواعيد الإقرارات، ومبادرات التسهيلات الضريبية — لتبقى منشأتك ممتثلة دائمًا وبلا غرامات تأخير.",
      seoCopy2:
        "مكتب محاسبة في الإسكندرية متخصص في الإقرارات الضريبية، كسب العمل، الفاتورة الإلكترونية، والتقاضي الضريبي — نساعدك على تطبيق كل ما يصدر عن المصلحة بمنهجية عملية تخص نشاطك.",
      offerBadge: "عرض خاص لعملاء الموقع",
      offerTitle: "استشارة ضريبية أولى مجانية",
      offerCopy: "15 دقيقة مع شركاء المكتب لمراجعة وضعك الضريبي وتحديد خطواتك القادمة — بلا التزام.",
      offerCta: "احجز استشارتك المجانية",
    },
    ctaBanner: {
      badge: "استشارة أولى مجانية",
      title: "هل أنت مستعد لتنظيم أرقامك؟",
      copy: "احجز استشارة مجانية مدتها 15 دقيقة مع شركاء المكتب اليوم — بلا التزام، فقط وضوح.",
      primary: "احجز استشارتي",
      secondary: "اتصل بأشرف الآن",
    },
    contact: {
      eyebrow: "تحدث مع مستشار",
      title: "أخبرنا بوضع نشاطك، وسنحدد لك الخطوة التالية.",
      copy: "احجز استشارة سرية مع شركاء المكتب واحصل على نطاق خدمة واضح يناسب احتياجك وميزانيتك.",
      details: {
        call: "اتصل بنا",
        write: "راسلنا",
        office: "مقر المكتب",
        mapsLabel: "الاتجاهات على خرائط جوجل",
        whatsapp: "واتساب",
      },
      form: {
        title: "أرسل طلبك الآن",
        sub: "نرد عادة خلال يوم عمل واحد.",
        name: "الاسم",
        namePlaceholder: "اسمك الكامل",
        phone: "رقم الهاتف",
        phonePlaceholder: "+20 1XX XXX XXXX",
        phoneHint: "اكتب الرقم بالمفتاح الدولي لمصر +20 — مثل 0100 123 4567 أو +20 100 123 4567",
        email: "البريد الإلكتروني (اختياري)",
        emailPlaceholder: "you@example.com",
        service: "الخدمة المطلوبة",
        servicePlaceholder: "اختر خدمة",
        message: "رسالتك",
        messagePlaceholder: "اكتب نبذة عن نشاطك وما تحتاجه…",
        submit: "أرسل الطلب",
        sending: "جارٍ الإرسال…",
        successTitle: "تم استلام طلبك بنجاح",
        successBody: "سيتواصل معك أحد الشريكين خلال يوم عمل واحد على الرقم الذي أدخلته.",
        errorBody: "تعذر إرسال الطلب — تحقق من البيانات أو تواصل معنا هاتفيًا.",
        required: "هذا الحقل مطلوب",
      },
    },
    footer: {
      tagline: "محاسبة وضرائب ومسك دفاتر وتأسيس شركات — وضوح في أرقامك وثقة في كل خطوة.",
      linksTitle: "روابط سريعة",
      servicesTitle: "أبرز الخدمات",
      contactTitle: "تواصل معنا",
      rights: "جميع الحقوق محفوظة.",
      call: "اتصال",
      whatsapp: "واتساب",
      location: "الإسكندرية - 5 شارع فيكتور عمانويل، مصطفى كامل - برج (جـ) شقة 403",
      locationShort: "مصطفى كامل، الإسكندرية",
      mapsLabel: "موقعنا على الخريطة",
    },
  },
  en: {
    dir: "ltr",
    localeDigits: "en-US",
    currency: "EGP",
    topbar: {
      location: "Mustafa Kamel, Alexandria",
    },
    nav: {
      services: "Services",
      why: "Why Us",
      about: "About",
      contact: "Contact",
      cta: "Talk to a Consultant",
      menu: "Menu",
      themeLight: "Light mode",
      themeDark: "Dark mode",
      switchLang: "تبديل اللغة",
      skip: "Skip to main content",
    },
    hero: {
      eyebrow: "Accounting, tax & business support — Alexandria & all Egypt",
      title: "Clarity in your numbers, confidence in every step.",
      lead: "Ashraf & Khaled Accounting Office — bookkeeping, taxes, payroll and company setup delivered by one responsive team, from your first document to your final return.",
      ctaPrimary: "Talk to a Consultant",
      ctaSecondary: "Explore Services",
      chips: ["Accounting", "Tax", "Payroll", "Company Setup"],
      dashboard: {
        brand: "AK OFFICE",
        brandSub: "Your compliance desk in Alexandria",
        live: "LIVE",
        statusLabel: "Current status",
        statusValue: "Records organized",
        ready: "READY",
        progressLabel: "Next priority",
        progressValue: "Tax return readiness",
        progressPct: 82,
        steps: ["Bookkeeping", "Tax filings", "Financial reports"],
        floatTopTitle: "VAT 14%",
        floatTopSub: "Return ready to file",
        floatBottomTitle: "Clearer reports",
        floatBottomSub: "Better decisions",
      },
    },
    metrics: [
      { value: `+${YEARS}`, label: "years of accounting & tax experience" },
      { value: "+350", label: "clients and companies we serve" },
      { value: "2", label: "founding partners tracking every file" },
      { value: "Egypt", label: "nationwide coverage — on-site & remote" },
    ],
    trust: [
      { icon: "badge", text: "Certified, seasoned accountants" },
      { icon: "lock", text: "Full confidentiality of your data" },
      { icon: "invoice", text: "E-invoice & e-receipt compliant" },
      { icon: "clock", text: "Tax deadlines tracked — no penalties" },
      { icon: "chat", text: "Direct WhatsApp support" },
    ],
    services: {
      eyebrow: "Our Services",
      title: "A trusted partner for every stage of your business",
      sub: "From the first journal entry to the annual tax return — every service is coordinated around your activity and obligations in Egypt.",
      filters: [
        { key: "all", label: "All services" },
        { key: "accounting", label: "Accounting" },
        { key: "tax", label: "Tax" },
        { key: "audit", label: "Audit" },
        { key: "companies", label: "Companies" },
        { key: "other", label: "Other" },
      ],
      discuss: "Discuss this service",
      items: [
        {
          key: "bookkeeping",
          cat: "accounting",
          icon: "book",
          title: "Accounting & Bookkeeping",
          desc: "Daily journal entries, ledgers, bank reconciliations, periodic reports and year-end closing.",
        },
        {
          key: "vat",
          cat: "tax",
          icon: "percent",
          title: "Value Added Tax (VAT)",
          desc: "Registration, monthly/quarterly filings, supporting documents and portal follow-up.",
        },
        {
          key: "returns",
          cat: "tax",
          icon: "file",
          title: "Tax Returns & Payroll Tax",
          desc: "Payroll tax, stamp duty, profit linkage and Egyptian Tax Authority deadline tracking.",
        },
        {
          key: "audit",
          cat: "audit",
          icon: "check",
          title: "Audit & Assurance",
          desc: "Independent review, Egyptian-standard financial statements and audit examination support.",
        },
        {
          key: "setup",
          cat: "companies",
          icon: "building",
          title: "Company Setup & Commercial Registry",
          desc: "Formation, amendments, renewals, government subscriptions and tax card issuance.",
        },
        {
          key: "einvoice",
          cat: "other",
          icon: "invoice",
          title: "E-Invoice & E-Receipt",
          desc: "Registration on the e-invoicing system, compliant invoice issuance and team training.",
        },
        {
          key: "payroll",
          cat: "accounting",
          icon: "wallet",
          title: "Payroll & Salary Sheets",
          desc: "Monthly payroll preparation, payroll tax and social insurance calculations.",
        },
        {
          key: "advisory",
          cat: "companies",
          icon: "trending",
          title: "Financial Advisory & Banking Support",
          desc: "Feasibility numbers, bank files, corporate account opening and pre-expansion assessment.",
        },
      ],
    },
    why: {
      eyebrow: "Why Our Office",
      title: "Services designed for owners who want clear answers",
      copy: "You get one clear owner of your file, documented progress, and a team that understands how accounting, taxes, the commercial registry and banking connect — so you never fall between providers.",
      cardLocation: "From Alexandria to every governorate of Egypt",
      cardYears: `+${YEARS}`,
      cardYearsLabel: "years of experience",
      cardStats: [
        { value: "27", label: "Egyptian governorates covered", icon: "map" },
        { value: "8", label: "specialized services under one roof", icon: "layers" },
        { value: "4", label: "free tax calculators", icon: "calculator" },
      ],
      benefits: [
        { n: "01", title: "One responsible team", desc: "A single contact for accounting, tax and corporate services." },
        { n: "02", title: "Clear scope & deadlines", desc: "You always know what's needed, what it costs, and what's next." },
        { n: "03", title: "Compliance-first execution", desc: "Records organized and ready for any examination, any time." },
        { n: "04", title: "Fast support inside Egypt", desc: "Direct access to the partners, follow-up until completion." },
      ],
    },
    testimonials: {
      eyebrow: "Client Voices",
      title: "Trusted by companies and businesses across governorates",
      sub: "Real feedback from clients we support in accounting, tax and corporate services.",
      items: [
        {
          quote: "They restructured our accounting within weeks. For the first time we filed our tax return well before the deadline.",
          name: "Mohamed Abdelrahman",
          role: "CFO — Trading company, Alexandria",
          initials: "MA",
        },
        {
          quote: "They handled our VAT registration and e-invoicing end-to-end. Full commitment without me chasing them.",
          name: "Noha Samir",
          role: "Founder — Online store, Alexandria",
          initials: "NS",
        },
        {
          quote: "One team for accounting, taxes and payroll. I finally stopped juggling multiple providers at once.",
          name: "Amr El-Shazly",
          role: "Factory owner — 10th of Ramadan",
          initials: "AS",
        },
        {
          quote: "Fast, organized and genuinely helpful. The first consultation alone saved us weeks of back-and-forth.",
          name: "Dalia Fouad",
          role: "Operations Manager — Clinics group, Alexandria",
          initials: "DF",
        },
      ],
    },
    calc: {
      eyebrow: "100% Free Tools",
      title: "Egyptian Tax Calculators",
      sub: "Four free professional tools — payroll tax, income tax, additional tax and delay fine — following the Egyptian Tax Authority methodology.",
      tabs: {
        payroll: "Payroll Tax",
        income: "Income Tax",
        vatFine: "Additional Tax",
        delayFine: "Delay Fine",
      },
      payroll: {
        modeMonthly: "Monthly input",
        modeAnnual: "Annual input",
        yearLabel: "Tax year",
        wageLabel: "Wage",
        wagePlaceholder: "e.g. 7,000",
        deductionsLabel: "Other deductions",
        deductionsHint: "Deductions excluded from insurance",
        allowancesLabel: "Insurance-exempt allowances",
        allowancesHint: "Capped at 30% of the insurable wage",
        insuranceSwitch: "Include social insurance",
        exemptionLabel: "Annual personal exemption",
        limitsLabel: "Insurance subscription limits",
        netMonthlyLabel: "Net monthly salary",
        monthlyTaxLabel: "Monthly tax",
        annualTaxLabel: "Annual tax",
        insuranceMonthlyLabel: "Monthly insurance",
        annualWageLabel: "Annual wage",
        taxBaseLabel: "Annual taxable income",
        empty: "Enter a wage to start calculating",
        insuranceTitle: "Social Insurance",
        insurableWage: "Insurable wage",
        employeeShare: "Employee share (11%)",
        employerShare: "Employer share (18.75%)",
        monthlyCol: "Monthly",
        annualCol: "Annual",
        bracketsTitle: "Tax brackets",
        colBand: "Band",
        colRate: "Rate",
        colTax: "Tax",
        colNet: "Net",
        totalRow: "Total",
      },
      income: {
        individual: "Individuals (natural persons)",
        company: "Companies (legal persons)",
        yearLabel: "Tax year",
        netIncomeLabel: "Annual net income",
        netIncomePlaceholder: "e.g. 500,000",
        resultLabel: "Annual tax",
        netAfterLabel: "Net income after tax",
        effectiveRateLabel: "Effective rate",
        empty: "Enter net income to start calculating",
        companyNote: "Corporate tax is a flat 22.5% on net profit",
        bracketsTitle: "Tax brackets",
        colBand: "Band",
        colRate: "Rate",
        colTax: "Tax",
        colNet: "Net",
        totalRow: "Total",
      },
      etaPanel: {
        badge: "Official source — live",
        title: "Egyptian Tax Authority updates",
        subtitle: "The latest news and instructions straight from the ETA official portal — so you never miss an update",
        newsTitle: "Latest news",
        lawsTitle: "Official laws & services",
        viewAll: "All news & updates",
        lastUpdated: "Last updated",
        refresh: "Refresh",
        refreshing: "Refreshing…",
        loading: "Loading updates from the authority…",
        offline: "Couldn't load updates right now — you can view them directly on the authority's portal",
        vatLaws: "VAT laws",
        incomeLaws: "Income tax laws",
        periodicBooks: "Periodic books & instructions",
        einvoice: "E-invoice inquiry",
        home: "ETA official portal",
        sourceNote: "All links lead to the official portal eta.gov.eg",
        translatedNote: "Headlines are machine-translated from the complete Arabic source — links open the original Arabic article",
      },
      vatFine: {
        periodLabel: "End of tax period",
        amountLabel: "Net examination difference",
        amountPlaceholder: "e.g. 5,000",
        noticeLabel: "Notification date from the tax office",
        paymentLabel: "Payment date",
        part1Title: "1.5% per month, capped at 36 months (3 years)",
        part1From: "Start of calculation",
        part1Months: "Months",
        part1Fine: "Fine",
        part2Title: "1.5% per month from notification until payment",
        part2From: "Notification date",
        part2To: "Payment date",
        part2Months: "Months",
        part2Fine: "Fine",
        totalLabel: "Total",
        empty: "Enter the amount and dates to calculate",
        note: "The additional tax applies to VAT examination differences per Article (35) — a partial month counts as a full month.",
      },
      delayFine: {
        entityLabel: "Entity",
        individual: "Individual",
        company: "Company",
        paymentLabel: "Final payment date",
        addEntryTitle: "Add examination difference",
        yearLabel: "Tax year",
        amountLabel: "Net examination difference",
        amountPlaceholder: "e.g. 50,000",
        addBtn: "Add",
        removeBtn: "Remove",
        clearAll: "Clear all",
        empty: "Add at least one examination difference to calculate",
        colStart: "Period start",
        colMonths: "Months",
        colRate: "Rate",
        colEntry: "Difference/Payment",
        colBalance: "Total differences",
        colFine: "Fine",
        totalRow: "Total",
        totalFineLabel: "Total fine",
        balanceLabel: "Total differences",
        note: "Delay fine = central-bank open-market discount rate + 2% per annum, starting April 1 for individuals and May 1 for companies, excluding fractional months and piasters.",
      },
      disclaimer:
        "Calculators are based on Egypt's tax laws in force (91/2005, 175/2023, VAT 67/2016) and the 14% VAT rate — results are indicative and special treatments may apply to your case.",
      cta: "Talk to a Consultant",
    },
    process: {
      eyebrow: "A Simpler Path to Done",
      title: "From the first conversation to service completion",
      steps: [
        { n: "01", title: "Understand", desc: "We review your activity, goals and deadlines." },
        { n: "02", title: "Plan", desc: "You receive a clear scope and timeline." },
        { n: "03", title: "Execute", desc: "We prepare documents and file the returns." },
        { n: "04", title: "Support", desc: "We keep records organized and guide next steps." },
      ],
    },
    about: {
      eyebrow: "About the Office",
      title: "Practical advice and precise execution, without unnecessary complexity.",
      copy: "We help business owners — new and established — make financial and tax decisions with confidence. Our approach combines Egyptian accounting expertise with disciplined documentation and compliance, with a clear written record at every step.",
      cta: "Talk to a Consultant",
      asideTitle: `Led by two partners with ${YEARS}+ combined years in accounting and tax`,
      asideCopy:
        "We believe long relationships start with organized records, on-time filings, and full clarity on fees and scope before anything begins.",
      chips: ["Accounting", "Tax", "Companies", "Compliance"],
      teamEyebrow: "Leadership",
      teamTitle: "The team behind the office",
      members: [
        {
          name: "Ashraf Mansy",
          role: "Founding Partner",
          spec: "Accounting & tax · Returns · Bookkeeping",
          initials: "AM",
          phone: CONTACT.ashraf.display,
          tel: CONTACT.ashraf.tel,
          whatsapp: CONTACT.ashraf.whatsapp,
          call: "Call Ashraf",
          whatsappLabel: "WhatsApp",
        },
        {
          name: "Khaled El-Sadek",
          role: "Founding Partner",
          spec: "Audit · Company setup · Advisory",
          initials: "KS",
          phone: CONTACT.khaled.display,
          tel: CONTACT.khaled.tel,
          whatsapp: CONTACT.khaled.whatsapp,
          call: "Call Khaled",
          whatsappLabel: "WhatsApp",
        },
      ],
    },
    journey: {
      eyebrow: "Client Journey",
      title: "How our relationship with clients evolves",
      sub: "From the first meeting to periodic reporting — a clear methodology that turns scattered documents into confident decisions.",
      milestones: [
        {
          tag: "Step 1",
          title: "Intro & understanding session",
          desc: "We listen to your goals, review your current position and available documents — with zero obligation.",
        },
        {
          tag: "Step 2",
          title: "Documents & books in order",
          desc: "We build a sound records base: organized entries, tidy tax files and a clear paper trail.",
        },
        {
          tag: "Step 3",
          title: "Registrations & filings on time",
          desc: "We handle tax registrations and periodic filings — no late penalties, no surprises.",
        },
        {
          tag: "Step 4",
          title: "Reports you can read and use",
          desc: "Periodic reports in plain language: where you stand now and what deserves attention first.",
        },
        {
          tag: "Step 5",
          title: "Scale with confidence",
          desc: "We plan the next step with you: financing, expansion or a new structure — on confirmed numbers, not guesses.",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Helpful answers before you start",
      contactLink: "Talk to a Consultant",
      searchPlaceholder: "Search questions…",
      searchLabel: "Filter questions",
      noResults: "No matching results — try another keyword or reach out directly.",
      items: [
        {
          q: "Do you offer services outside Alexandria?",
          a: "Yes, we serve clients across all Egyptian governorates — on-site where needed, and remotely through digital communication and electronic document sharing.",
        },
        {
          q: "Do you work with both individuals and companies?",
          a: "Yes — freelancers, sole proprietorships, partnerships and companies. Each segment gets a suitable scope of services and fees.",
        },
        {
          q: "Can one team really manage everything?",
          a: "Yes. One account coordinator tracks accounting, taxes and the commercial registry so documents and deadlines stay aligned in a single file.",
        },
        {
          q: "How does the first consultation work?",
          a: "We review your activity, documents and deadlines, then present a clear scope, next steps and fees — before any commitment on your side.",
        },
        {
          q: "Do you handle e-invoicing and e-receipts?",
          a: "Yes — we register your activity on the system, set up compliant invoice issuance, and train your team on correct daily usage.",
        },
        {
          q: "What do I need to get started?",
          a: "Your latest balance sheet and previous returns if available, plus copies of your basic activity documents — we guide you step by step.",
        },
      ],
    },
    insights: {
      eyebrow: "Insights",
      title: "Practical guidance for businesses in Egypt",
      sub: "Clear, actionable updates on taxes, accounting and compliance — written by our team.",
      readMore: "Request a consultation",
      items: [
        {
          icon: "invoice",
          cat: "Invoicing",
          title: "E-invoice & e-receipt: what your business needs in 2025",
          desc: "A practical look at rollout phases, target segments and what to prepare before registration.",
          date: "January 2025",
          read: "6 min read",
        },
        {
          icon: "percent",
          cat: "Tax",
          title: "VAT registration: when does it become mandatory?",
          desc: "If your sales exceed EGP 500,000 a year, registration may be obligatory — here's the process and alternatives.",
          date: "December 2024",
          read: "4 min read",
        },
        {
          icon: "building",
          cat: "Setup",
          title: "Setting up a company in Egypt: practical steps via GAFI",
          desc: "Choosing the legal form, commercial registry and tax card — a quick comparison before you start.",
          date: "November 2024",
          read: "7 min read",
        },
        {
          icon: "file",
          cat: "Tax",
          title: "The annual return: a practical preparation timeline",
          desc: "Don't wait for the last moment — a monthly plan to prepare your return without stress or errors.",
          date: "October 2024",
          read: "5 min read",
        },
        {
          icon: "wallet",
          cat: "Payroll",
          title: "Payroll sheets & payroll tax: a quick owner's guide",
          desc: "New brackets, tax calculation and social insurance — with simple numeric examples.",
          date: "September 2024",
          read: "4 min read",
        },
        {
          icon: "trending",
          cat: "Management",
          title: "In-house accountant or external firm? How to choose",
          desc: "A cost-control-confidentiality comparison — and why many choose both.",
          date: "August 2024",
          read: "6 min read",
        },
      ],
    },
    offerPopup: {
      badge: "Limited-time offer",
      title: "Free first tax consultation",
      copy: "15 minutes with an office partner to review your position and next action plan — no commitment.",
      cta: "Book your free consultation",
      close: "Close",
      a11yLabel: "Free consultation offer",
    },
    etaSection: {
      eyebrow: "Official Tax Portal",
      title: "Egyptian Tax Authority news & legislation",
      sub: "Follow Egypt's latest tax developments as they happen — authority news, tax laws & legislation, periodic books and instructions — straight from the official portal eta.gov.eg, with Ashraf & Khaled Accounting Office's reading of what matters for your business.",
      seoCopy1:
        "We track the Egyptian Tax Authority's updates first-hand: income tax and VAT law amendments, executive instructions, return deadlines, and tax facilitation initiatives — so your business stays compliant and penalty-free.",
      seoCopy2:
        "An Alexandria accounting office specialised in tax returns, payroll tax, e-invoicing and tax litigation — we help you apply everything the authority issues with a practical methodology tailored to your activity.",
      offerBadge: "Exclusive website offer",
      offerTitle: "Free first tax consultation",
      offerCopy: "15 minutes with the office partners to review your tax position and define your next steps — no commitment.",
      offerCta: "Book your free consultation",
    },
    ctaBanner: {
      badge: "Free first consultation",
      title: "Ready to get your numbers in order?",
      copy: "Book a free 15-minute consultation with the office partners today — no commitment, just clarity.",
      primary: "Book My Consultation",
      secondary: "Call Ashraf Now",
    },
    contact: {
      eyebrow: "Talk to a Consultant",
      title: "Tell us where your business stands, and we'll define your next step.",
      copy: "Book a confidential consultation with the office partners and get a clear service scope that fits your needs and budget.",
      details: {
        call: "Call us",
        write: "Write to us",
        office: "Our Office",
        mapsLabel: "Directions on Google Maps",
        whatsapp: "WhatsApp",
      },
      form: {
        title: "Send your request now",
        sub: "We usually reply within one business day.",
        name: "Name",
        namePlaceholder: "Your full name",
        phone: "Phone number",
        phonePlaceholder: "+20 1XX XXX XXXX",
        phoneHint: "Enter the number with Egypt country code +20 — e.g. 0100 123 4567 or +20 100 123 4567",
        email: "Email (optional)",
        emailPlaceholder: "you@example.com",
        service: "Requested service",
        servicePlaceholder: "Choose a service",
        message: "Your message",
        messagePlaceholder: "Tell us briefly about your activity and what you need…",
        submit: "Send Request",
        sending: "Sending…",
        successTitle: "Request received successfully",
        successBody: "One of the partners will contact you within one business day on the number you entered.",
        errorBody: "Could not send the request — check the fields or reach us by phone.",
        required: "This field is required",
      },
    },
    footer: {
      tagline: "Accounting, tax, bookkeeping and company setup — clarity in your numbers, confidence in every step.",
      linksTitle: "Quick Links",
      servicesTitle: "Top Services",
      contactTitle: "Contact Us",
      rights: "All rights reserved.",
      call: "Call",
      whatsapp: "WhatsApp",
      location: "Alexandria - 5 Victor Emmanuel St., Mustafa Kamel - Tower (C), Apt. 403",
      locationShort: "Mustafa Kamel, Alexandria",
      mapsLabel: "Find us on the map",
    },
  },
} as const;

export type Content = {
  dir: "rtl" | "ltr";
  localeDigits: string;
  currency: string;
  topbar: { location: string };
  nav: {
    services: string;
    why: string;
    about: string;
    contact: string;
    cta: string;
    menu: string;
    themeLight: string;
    themeDark: string;
    switchLang: string;
    skip: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    chips: readonly string[];
    dashboard: {
      brand: string;
      brandSub: string;
      live: string;
      statusLabel: string;
      statusValue: string;
      ready: string;
      progressLabel: string;
      progressValue: string;
      progressPct: number;
      steps: readonly string[];
      floatTopTitle: string;
      floatTopSub: string;
      floatBottomTitle: string;
      floatBottomSub: string;
    };
  };
  metrics: { value: string; label: string }[];
  trust: { icon: string; text: string }[];
  services: {
    eyebrow: string;
    title: string;
    sub: string;
    filters: { key: string; label: string }[];
    discuss: string;
    items: {
      key: string;
      cat: string;
      icon: string;
      title: string;
      desc: string;
    }[];
  };
  why: {
    eyebrow: string;
    title: string;
    copy: string;
    cardLocation: string;
    cardYears: string;
    cardYearsLabel: string;
    cardStats: { value: string; label: string; icon: "map" | "layers" | "calculator" }[];
    benefits: { n: string; title: string; desc: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { quote: string; name: string; role: string; initials: string }[];
  };
  calc: {
    eyebrow: string;
    title: string;
    sub: string;
    tabs: {
      payroll: string;
      income: string;
      vatFine: string;
      delayFine: string;
    };
    payroll: {
      modeMonthly: string;
      modeAnnual: string;
      yearLabel: string;
      wageLabel: string;
      wagePlaceholder: string;
      deductionsLabel: string;
      deductionsHint: string;
      allowancesLabel: string;
      allowancesHint: string;
      insuranceSwitch: string;
      exemptionLabel: string;
      limitsLabel: string;
      netMonthlyLabel: string;
      monthlyTaxLabel: string;
      annualTaxLabel: string;
      insuranceMonthlyLabel: string;
      annualWageLabel: string;
      taxBaseLabel: string;
      empty: string;
      insuranceTitle: string;
      insurableWage: string;
      employeeShare: string;
      employerShare: string;
      monthlyCol: string;
      annualCol: string;
      bracketsTitle: string;
      colBand: string;
      colRate: string;
      colTax: string;
      colNet: string;
      totalRow: string;
    };
    income: {
      individual: string;
      company: string;
      yearLabel: string;
      netIncomeLabel: string;
      netIncomePlaceholder: string;
      resultLabel: string;
      netAfterLabel: string;
      effectiveRateLabel: string;
      empty: string;
      companyNote: string;
      bracketsTitle: string;
      colBand: string;
      colRate: string;
      colTax: string;
      colNet: string;
      totalRow: string;
    };
    etaPanel: {
      badge: string;
      title: string;
      subtitle: string;
      newsTitle: string;
      lawsTitle: string;
      viewAll: string;
      lastUpdated: string;
      refresh: string;
      refreshing: string;
      loading: string;
      offline: string;
      vatLaws: string;
      incomeLaws: string;
      periodicBooks: string;
      einvoice: string;
      home: string;
      sourceNote: string;
      translatedNote: string;
    };
    vatFine: {
      periodLabel: string;
      amountLabel: string;
      amountPlaceholder: string;
      noticeLabel: string;
      paymentLabel: string;
      part1Title: string;
      part1From: string;
      part1Months: string;
      part1Fine: string;
      part2Title: string;
      part2From: string;
      part2To: string;
      part2Months: string;
      part2Fine: string;
      totalLabel: string;
      empty: string;
      note: string;
    };
    delayFine: {
      entityLabel: string;
      individual: string;
      company: string;
      paymentLabel: string;
      addEntryTitle: string;
      yearLabel: string;
      amountLabel: string;
      amountPlaceholder: string;
      addBtn: string;
      removeBtn: string;
      clearAll: string;
      empty: string;
      colStart: string;
      colMonths: string;
      colRate: string;
      colEntry: string;
      colBalance: string;
      colFine: string;
      totalRow: string;
      totalFineLabel: string;
      balanceLabel: string;
      note: string;
    };
    disclaimer: string;
    cta: string;
  };
  process: {
    eyebrow: string;
    title: string;
    steps: { n: string; title: string; desc: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    copy: string;
    cta: string;
    asideTitle: string;
    asideCopy: string;
    chips: readonly string[];
    teamEyebrow: string;
    teamTitle: string;
    members: {
      name: string;
      role: string;
      spec: string;
      initials: string;
      phone: string;
      tel: string;
      whatsapp: string;
      call: string;
      whatsappLabel: string;
    }[];
  };
  journey: {
    eyebrow: string;
    title: string;
    sub: string;
    milestones: { tag: string; title: string; desc: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    contactLink: string;
    searchPlaceholder: string;
    searchLabel: string;
    noResults: string;
    items: { q: string; a: string }[];
  };
  insights: {
    eyebrow: string;
    title: string;
    sub: string;
    readMore: string;
    items: { icon: string; cat: string; title: string; desc: string; date: string; read: string }[];
  };
  offerPopup: {
    badge: string;
    title: string;
    copy: string;
    cta: string;
    close: string;
    a11yLabel: string;
  };
  etaSection: {
    eyebrow: string;
    title: string;
    sub: string;
    seoCopy1: string;
    seoCopy2: string;
    offerBadge: string;
    offerTitle: string;
    offerCopy: string;
    offerCta: string;
  };
  ctaBanner: {
    badge: string;
    title: string;
    copy: string;
    primary: string;
    secondary: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    copy: string;
    details: {
      call: string;
      write: string;
      office: string;
      mapsLabel: string;
      whatsapp: string;
    };
    form: {
      title: string;
      sub: string;
      name: string;
      namePlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      phoneHint: string;
      email: string;
      emailPlaceholder: string;
      service: string;
      servicePlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      successTitle: string;
      successBody: string;
      errorBody: string;
      required: string;
    };
  };
  footer: {
    tagline: string;
    linksTitle: string;
    servicesTitle: string;
    contactTitle: string;
    rights: string;
    call: string;
    whatsapp: string;
    location: string;
    locationShort: string;
    mapsLabel: string;
  };
};
