/**
 * Egyptian income-tax & payroll engine — a faithful port of the calculator at
 * asma-systems.com/others/tax/income (صفحة ضريبة الدخل) and its salary page
 * (كسب العمل), extracted verbatim from the site's compiled bundle.
 *
 * The data below (law tables, thresholds, insurance limits, stamp-duty tiers)
 * mirrors the source 1:1 so a future legal update is a data-only edit:
 * add/adjust one LAW_TABLE entry and (if needed) one INSURANCE_LAWS entry.
 *
 * Conventions kept from the source:
 * - Amounts are floored to a multiple of 10 before the bracket calculation.
 * - Band boundaries are consumed only when income is STRICTLY above the bound.
 * - Bracket rates are percent numbers (22.5 means 22.5%); `segments` carry the
 *   cumulative upper bounds and the last rate covers everything beyond them.
 * - `cuts` are law-specific discounts (خصم) applied to the whole tax, chosen
 *   by how many bands the income reached.
 * - Internal arithmetic is kept to 4 decimals like the source's decimal class.
 */

/* ------------------------------ money helpers ------------------------------ */

/** Round to 4 decimals — mirrors the source decimal's internal precision. */
function r4(x: number): number {
  return Math.round((x + Number.EPSILON) * 10000) / 10000;
}

/** Floor to a multiple of `step` (source `toLeast`). */
function toLeast(x: number, step: number): number {
  return Math.floor(r4(x) / step) * step;
}

/** Smallest representable percent step for stamp duty (ceil to 0.05). */
function ceilTo5Piastres(x: number): number {
  return Math.ceil(r4(x) * 20) / 20;
}

/* ------------------------------ bracket tables ------------------------------ */

export type BracketSet = {
  /** Cumulative upper bounds of the bands. */
  segments: number[];
  /** One rate per band plus a final rate for everything beyond the last bound (percents). */
  rates: number[];
  /** Optional per-band discount (خصم) applied to the whole tax, indexed by bands reached. */
  cuts?: number[] | null;
};

export type BracketRow = {
  amount: number;
  /** null = the source table defines no rate for this band (law 96/2015 above 1M):
   *  the live site then renders "%" and a zero tax — mirrored here. */
  rate: number | null;
  tax: number;
  /** Amount kept from this band after its tax. */
  net: number;
};

export type TaxTable = {
  rows: BracketRow[];
  /** Tax before the law discount. */
  tax: number;
  /** Discount percent (خصم) when the law provides one, else null. */
  discountRate: number | null;
  discount: number;
  /** Tax after the discount. */
  netTax: number;
  /** Income kept after tax (before-discount gross plus the discount). */
  net: number;
};

/** Source `ye.segment` + `DC.createSegments`: split income over the bands. */
function splitSegments(income: number, segments: number[]): number[] {
  const parts: number[] = [];
  let previous = 0;
  for (const bound of segments) {
    if (!(income > bound)) break; // strictly-above semantics, mirrored exactly
    parts.push(r4(bound - previous));
    previous = bound;
  }
  parts.push(r4(income - previous));
  return parts;
}

/** Source `DC` — bracket calculation with the optional law discount. */
export function computeTaxTable(income: number, set: BracketSet): TaxTable {
  const safeIncome = Math.max(0, toLeast(income, 10));
  const parts = splitSegments(safeIncome, set.segments);
  const rows: BracketRow[] = [];
  let tax = 0;
  let net = 0;
  for (let i = 0; i < parts.length; i++) {
    // The source's 2015 individual table is short one rate (undefined above 1M);
    // the live site then shows "%" and a ZERO tax for that band — mirror it.
    const rate = i < set.rates.length ? set.rates[i] : null;
    const bandTax = rate === null ? 0 : r4((parts[i] * rate) / 100);
    tax = r4(tax + bandTax);
    net = r4(net + parts[i] - bandTax);
    rows.push({ amount: parts[i], rate, tax: bandTax, net: r4(parts[i] - bandTax) });
  }
  let discountRate: number | null = null;
  let discount = 0;
  if (set.cuts) {
    const cutRate = set.cuts[rows.length - 1];
    if (typeof cutRate === "number" && cutRate > 0) {
      discountRate = cutRate;
      discount = r4((tax * cutRate) / 100);
    }
  }
  const netTax = r4(tax - discount);
  return { rows, tax, discountRate, discount, netTax, net: r4(net + discount) };
}

/* ------------------------------ individual rules ---------------------------- */

/**
 * High-income tier rules (2020+ laws): above each threshold the zero/low bands
 * drop out and the table shifts up, exactly as in the source.
 */
type IndividualRule = (annualIncome: number) => BracketSet;

function tiered(base: BracketSet, tiers: readonly { above: number; set: BracketSet }[]): IndividualRule {
  return (annualIncome) => {
    for (const tier of tiers) if (annualIncome > tier.above) return tier.set;
    return base;
  };
}

/* ---------------------------------- laws ----------------------------------- */

export type TaxLaw = {
  id: string;
  /** Law number & year for display, e.g. "7" / 2024 → قانون 7 لسنة 2024. */
  lawNumber: string;
  lawYear: number;
  individual: IndividualRule | BracketSet;
  company: BracketSet;
  /** Inclusive start date (year, 1-based month, day). */
  start: { y: number; m: number; d: number };
};

function ruleFor(law: TaxLaw, annualIncome: number): BracketSet {
  return typeof law.individual === "function" ? law.individual(annualIncome) : law.individual;
}

const T2024: TaxLaw = {
  id: "t2024",
  lawNumber: "7",
  lawYear: 2024,
  individual: tiered(
    { segments: [40_000, 55_000, 70_000, 200_000, 400_000], rates: [0, 10, 15, 20, 22.5, 25] },
    [
      { above: 1_200_000, set: { segments: [1_200_000], rates: [25, 27.5] } },
      { above: 900_000, set: { segments: [400_000], rates: [22.5, 25] } },
      { above: 800_000, set: { segments: [200_000, 400_000], rates: [20, 22.5, 25] } },
      { above: 700_000, set: { segments: [70_000, 200_000, 400_000], rates: [15, 20, 22.5, 25] } },
      { above: 600_000, set: { segments: [55_000, 70_000, 200_000, 400_000], rates: [10, 15, 20, 22.5, 25] } },
    ]
  ),
  company: { segments: [], rates: [22.5] },
  start: { y: 2024, m: 3, d: 1 },
};

const T2023_2: TaxLaw = {
  id: "t2023_2",
  lawNumber: "175",
  lawYear: 2023,
  individual: tiered(
    { segments: [30_000, 45_000, 60_000, 200_000, 400_000], rates: [0, 10, 15, 20, 22.5, 25] },
    [
      { above: 1_200_000, set: { segments: [1_200_000], rates: [25, 27.5] } },
      { above: 900_000, set: { segments: [400_000], rates: [22.5, 25] } },
      { above: 800_000, set: { segments: [200_000, 400_000], rates: [20, 22.5, 25] } },
      { above: 700_000, set: { segments: [60_000, 200_000, 400_000], rates: [15, 20, 22.5, 25] } },
      { above: 600_000, set: { segments: [45_000, 60_000, 200_000, 400_000], rates: [10, 15, 20, 22.5, 25] } },
    ]
  ),
  company: { segments: [], rates: [22.5] },
  start: { y: 2023, m: 11, d: 1 },
};

const T2023: TaxLaw = {
  id: "t2023",
  lawNumber: "30",
  lawYear: 2023,
  individual: tiered(
    { segments: [21_000, 30_000, 45_000, 60_000, 200_000, 400_000], rates: [0, 2.5, 10, 15, 20, 22.5, 25] },
    [
      { above: 1_200_000, set: { segments: [1_200_000], rates: [25, 27.5] } },
      { above: 900_000, set: { segments: [200_000, 400_000], rates: [20, 22.5, 25] } },
      { above: 800_000, set: { segments: [60_000, 200_000, 400_000], rates: [15, 20, 22.5, 25] } },
      { above: 700_000, set: { segments: [45_000, 60_000, 200_000, 400_000], rates: [10, 15, 20, 22.5, 25] } },
      { above: 600_000, set: { segments: [30_000, 45_000, 60_000, 200_000, 400_000], rates: [2.5, 10, 15, 20, 22.5, 25] } },
    ]
  ),
  company: { segments: [], rates: [22.5] },
  start: { y: 2023, m: 7, d: 1 },
};

const T2020: TaxLaw = {
  id: "t2020",
  lawNumber: "26",
  lawYear: 2020,
  individual: tiered(
    { segments: [15_000, 30_000, 45_000, 60_000, 200_000, 400_000], rates: [0, 2.5, 10, 15, 20, 22.5, 25] },
    [
      { above: 1_000_000, set: { segments: [400_000], rates: [22.5, 25] } },
      { above: 900_000, set: { segments: [200_000, 400_000], rates: [20, 22.5, 25] } },
      { above: 800_000, set: { segments: [60_000, 200_000, 400_000], rates: [15, 20, 22.5, 25] } },
      { above: 700_000, set: { segments: [45_000, 60_000, 200_000, 400_000], rates: [10, 15, 20, 22.5, 25] } },
      { above: 600_000, set: { segments: [30_000, 45_000, 60_000, 200_000, 400_000], rates: [2.5, 10, 15, 20, 22.5, 25] } },
    ]
  ),
  company: { segments: [], rates: [22.5] },
  start: { y: 2020, m: 7, d: 1 },
};

const T2018: TaxLaw = {
  id: "t2018",
  lawNumber: "97",
  lawYear: 2018,
  individual: { segments: [8_000, 30_000, 45_000, 200_000], rates: [0, 10, 15, 20, 22.5], cuts: [0, 85, 45, 7.5, 0] },
  company: { segments: [], rates: [22.5] },
  start: { y: 2018, m: 7, d: 1 },
};

const T2017: TaxLaw = {
  id: "t2017",
  lawNumber: "82",
  lawYear: 2017,
  individual: { segments: [7_200, 30_000, 45_000, 200_000], rates: [0, 10, 15, 20, 22.5], cuts: [0, 80, 40, 5, 0] },
  company: { segments: [], rates: [22.5] },
  start: { y: 2017, m: 7, d: 1 },
};

const T2016: TaxLaw = {
  id: "t2016",
  lawNumber: "96",
  lawYear: 2015,
  individual: { segments: [6_500, 30_000, 45_000, 200_000], rates: [0, 10, 15, 20, 22.5] },
  company: { segments: [], rates: [22.5] },
  start: { y: 2016, m: 1, d: 1 },
};

const T2015: TaxLaw = {
  id: "t2015",
  lawNumber: "96",
  lawYear: 2015,
  individual: { segments: [6_500, 30_000, 45_000, 200_000, 1_000_000], rates: [0, 10, 15, 20, 22.5] },
  company: { segments: [1_000_000], rates: [22.5] },
  start: { y: 2015, m: 9, d: 1 },
};

const T2014: TaxLaw = {
  id: "t2014",
  lawNumber: "44",
  lawYear: 2014,
  individual: { segments: [5_000, 30_000, 45_000, 250_000, 1_000_000], rates: [0, 10, 15, 20, 25, 30] },
  company: { segments: [1_000_000], rates: [25, 30] },
  start: { y: 2014, m: 7, d: 1 },
};

const T2013: TaxLaw = {
  id: "t2013",
  lawNumber: "11",
  lawYear: 2013,
  individual: { segments: [5_000, 30_000, 45_000, 250_000], rates: [0, 10, 15, 20, 25] },
  company: { segments: [], rates: [25] },
  start: { y: 2013, m: 5, d: 1 },
};

const T2012: TaxLaw = {
  id: "t2012",
  lawNumber: "101",
  lawYear: 2012,
  individual: { segments: [5_000, 30_000, 45_000, 1_000_000], rates: [0, 10, 15, 20, 25] },
  company: { segments: [], rates: [25] },
  start: { y: 2013, m: 1, d: 1 },
};

const T2011: TaxLaw = {
  id: "t2011",
  lawNumber: "51",
  lawYear: 2011,
  individual: { segments: [5_000, 20_000, 40_000, 10_000_000], rates: [0, 10, 15, 20, 25] },
  company: { segments: [10_000_000], rates: [20, 25] },
  start: { y: 2011, m: 7, d: 1 },
};

const T2005: TaxLaw = {
  id: "t2005",
  lawNumber: "91",
  lawYear: 2005,
  individual: { segments: [5_000, 20_000, 40_000], rates: [0, 10, 15, 20] },
  company: { segments: [], rates: [20] },
  start: { y: 2005, m: 7, d: 1 },
};

/** Source `getByYear` — the income page's year mapping. */
const LAWS_BY_YEAR: Record<number, TaxLaw> = {
  2026: T2024,
  2025: T2024,
  2024: T2024,
  2023: T2023_2,
  2020: T2020,
  2019: T2018,
  2018: T2018,
  2017: T2017,
  2016: T2016,
  2015: T2015,
  2014: T2014,
  2013: T2013,
  2012: T2011,
  2011: T2011,
  2010: T2005,
  2009: T2005,
  2008: T2005,
  2007: T2005,
  2006: T2005,
  2005: T2005,
};

/** Source `getByMonth` — descending by start date; first law whose start ≤ month wins. */
const LAWS_BY_START: readonly TaxLaw[] = [
  T2024,
  T2023_2,
  T2023,
  T2020,
  T2018,
  T2017,
  T2016,
  T2015,
  T2014,
  T2013,
  T2012,
  T2011,
  T2005,
];

function toMonthKey(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

function getLawByMonth(year: number, month1to12: number): TaxLaw {
  const key = toMonthKey(year, month1to12, 1);
  for (const law of LAWS_BY_START) {
    if (key >= toMonthKey(law.start.y, law.start.m, law.start.d)) return law;
  }
  throw new Error(`undefined salary law: ${year}-${month1to12}`);
}

function getLawByYear(year: number): TaxLaw {
  const law = LAWS_BY_YEAR[year];
  if (!law) throw new Error(`Invalid tax year: ${year}`);
  return law;
}

/** Source `getPersonalExemption` — annual personal exemption (الإعفاء الشخصي) by month. */
export function getPersonalExemption(year: number, month1to12: number): number {
  const key = toMonthKey(year, month1to12, 1);
  if (key < toMonthKey(2013, 9, 1)) return 4_000;
  if (key < toMonthKey(2020, 7, 1)) return 7_000;
  if (key < toMonthKey(2023, 7, 1)) return 9_000;
  if (key < toMonthKey(2024, 3, 1)) return 15_000;
  return 20_000;
}

/* ----------------------------- social insurance ----------------------------- */

export type Sector = "private" | "public" | "goverment";

type InsuranceLimits = {
  primary: { low: number; high: number };
  secondary: { low: number; high: number };
};

type InsurancePercents = {
  employee: { primary: number; secondary: number };
  company: { primary: number; secondary: number };
};

type InsuranceLaw = { limits: InsuranceLimits; percents: InsurancePercents };

/**
 * Source `sn.laws` — (primaryLow, primaryHigh, secondaryLow, secondaryHigh)
 * monthly insurable-wage limits per calendar year.
 */
const INSURANCE_LAWS: Record<number, InsuranceLaw> = {
  2026: { limits: { primary: { low: 2700, high: 16700 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2025: { limits: { primary: { low: 2300, high: 14500 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2024: { limits: { primary: { low: 2000, high: 12600 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2023: { limits: { primary: { low: 1700, high: 10900 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2022: { limits: { primary: { low: 1400, high: 9400 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2021: { limits: { primary: { low: 1200, high: 8100 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2020: { limits: { primary: { low: 1000, high: 7000 }, secondary: { low: 0, high: 0 } }, percents: defaultPercents() },
  2019: { limits: { primary: { low: 250, high: 1670 }, secondary: { low: 531.25, high: 4040 } }, percents: defaultPercents() },
  2018: { limits: { primary: { low: 220, high: 1510 }, secondary: { low: 405, high: 3080 } }, percents: defaultPercents() },
  2017: { limits: { primary: { low: 200, high: 1370 }, secondary: { low: 300, high: 2430 } }, percents: defaultPercents() },
  2016: { limits: { primary: { low: 180, high: 1240 }, secondary: { low: 220, high: 2110 } }, percents: defaultPercents() },
  2015: { limits: { primary: { low: 160, high: 1120 }, secondary: { low: 0, high: 1830 } }, percents: defaultPercents() },
  2014: { limits: { primary: { low: 141.75, high: 1012.5 }, secondary: { low: 0, high: 1590 } }, percents: defaultPercents() },
  2013: { limits: { primary: { low: 138.5, high: 987.5 }, secondary: { low: 0, high: 1380 } }, percents: defaultPercents() },
  2012: { limits: { primary: { low: 127.5, high: 912.5 }, secondary: { low: 0, high: 1200 } }, percents: defaultPercents() },
  2011: { limits: { primary: { low: 122.5, high: 875 }, secondary: { low: 0, high: 1050 } }, percents: defaultPercents() },
  2010: { limits: { primary: { low: 119, high: 850 }, secondary: { low: 0, high: 900 } }, percents: defaultPercents() },
  2009: { limits: { primary: { low: 112, high: 800 }, secondary: { low: 0, high: 750 } }, percents: defaultPercents() },
  2008: { limits: { primary: { low: 108.5, high: 775 }, secondary: { low: 0, high: 625 } }, percents: defaultPercents() },
};

function defaultPercents(): InsurancePercents {
  return {
    employee: { primary: 14, secondary: 11 },
    company: { primary: 26, secondary: 24 },
  };
}

/** Source `setPercents` — from 2020 the employee share is 11% on the primary only. */
function applySectorPercents(law: InsuranceLaw, year: number, sector: Sector): void {
  if (year >= 2020) {
    law.percents.employee = { primary: 11, secondary: 0 };
    law.percents.company = {
      primary: sector === "public" ? 18.25 : sector === "goverment" ? 17.25 : 18.75,
      secondary: 0,
    };
  }
}

export type InsuranceLimitsView = {
  primary: { low: number; high: number };
  secondary: { low: number; high: number };
  employee: { primary: number; secondary: number };
  company: { primary: number; secondary: number };
};

/** Monthly insurable limits + applied percentages for a calendar year/sector. */
export function getInsuranceInfo(year: number, sector: Sector = "private"): InsuranceLimitsView {
  const base = INSURANCE_LAWS[year];
  if (!base) throw new Error(`Invalid insurance year: ${year}`);
  const law: InsuranceLaw = {
    limits: {
      primary: { ...base.limits.primary },
      secondary: { ...base.limits.secondary },
    },
    percents: defaultPercents(),
  };
  applySectorPercents(law, year, sector);
  return { ...law.limits, employee: law.percents.employee, company: law.percents.company };
}

export type InsuranceResult = {
  validPrimary: boolean;
  validTotal: boolean;
  /** Invalid insurance yields zeros, exactly like the source. */
  employeePrimary: number;
  employeeSecondary: number;
  employeeTotal: number;
  companyPrimary: number;
  companySecondary: number;
  companyTotal: number;
  basePrimary: number;
  baseSecondary: number;
  /** Which minimum was missed, for the error message. */
  errorKind: "primary" | "total" | null;
};

/** Source `TD` — insurance shares on the min-capped wage; invalid → all zeros. */
function computeInsurance(
  year: number,
  sector: Sector,
  primary: number,
  secondary: number
): { result: InsuranceResult; limits: InsuranceLimits } {
  const base = INSURANCE_LAWS[year];
  if (!base) throw new Error(`Invalid insurance year: ${year}`);
  const law: InsuranceLaw = {
    limits: { primary: { ...base.limits.primary }, secondary: { ...base.limits.secondary } },
    percents: defaultPercents(),
  };
  applySectorPercents(law, year, sector);
  const { limits, percents } = law;

  const validPrimary = primary >= limits.primary.low;
  const validTotal = primary + secondary >= limits.primary.low + limits.secondary.low;
  if (!validPrimary || !validTotal) {
    return {
      result: {
        validPrimary,
        validTotal,
        employeePrimary: 0,
        employeeSecondary: 0,
        employeeTotal: 0,
        companyPrimary: 0,
        companySecondary: 0,
        companyTotal: 0,
        basePrimary: 0,
        baseSecondary: 0,
        errorKind: validPrimary ? "total" : "primary",
      },
      limits,
    };
  }
  const basePrimary = Math.min(primary, limits.primary.high);
  const baseSecondary = Math.min(secondary, limits.secondary.high);
  const employeePrimary = r4((basePrimary * percents.employee.primary) / 100);
  const employeeSecondary = r4((baseSecondary * percents.employee.secondary) / 100);
  const companyPrimary = r4((basePrimary * percents.company.primary) / 100);
  const companySecondary = r4((baseSecondary * percents.company.secondary) / 100);
  return {
    result: {
      validPrimary,
      validTotal,
      employeePrimary,
      employeeSecondary,
      employeeTotal: r4(employeePrimary + employeeSecondary),
      companyPrimary,
      companySecondary,
      companyTotal: r4(companyPrimary + companySecondary),
      basePrimary,
      baseSecondary,
      errorKind: null,
    },
    limits,
  };
}

/* --------------------------------- stamp duty -------------------------------- */

/**
 * Source `Tm` — نسبية الدمغة (emergency/stamp fee) on the monthly total wage,
 * computed on (total − 50) and rounded UP to the nearest 5 piastres.
 * Private-sector employees are exempt; the source applies it to public/government only.
 */
export function computeDamgha(monthlyTotal: number): number {
  const amount = monthlyTotal - 50;
  const fee = damghaValue(amount);
  return fee > 0 ? ceilTo5Piastres(fee) : 0;
}

function damghaValue(n: number): number {
  if (n > 10_000) return r4((n - 10_000) * (3 / 1000) + 10_000 * (8 / 1000));
  if (n > 5_000) return r4(n * (8 / 1000));
  if (n > 1_000) return r4(n * (75 / 10000));
  if (n > 500) return r4(n * (7 / 1000));
  if (n > 250) return r4(n * (65 / 10000));
  if (n > 50) return r4(n * (6 / 1000));
  return 0;
}

/* -------------------------------- payroll year ------------------------------- */

export type SalaryMonthInput = {
  primary: number;
  secondary: number;
  saved: number;
  cuts: number;
};

export type SalaryYearInput = {
  year: number;
  sector: Sector;
  /** Monthly amounts (the UI divides annual inputs by 12 before calling). */
  monthly: SalaryMonthInput;
  calcInsurance: boolean;
};

export type SalaryMonthResult = {
  month: number;
  lawId: string;
  lawNumber: string;
  lawYear: number;
  salaryTotal: number;
  insuranceEmployee: number;
  insuranceEmployer: number;
  /** Min-capped insurable wage the shares apply to (0 when invalid/off). */
  insuranceBase: number;
  damgha: number;
  cuts: number;
  saved: number;
  beforeTax: number;
  personalExemptionAnnual: number;
  personalMonthly: number;
  taxableMonthly: number;
  tax: number;
  net: number;
  insuranceErrorKind: "primary" | "total" | null;
};

export type LawGroupResult = {
  lawId: string;
  lawNumber: string;
  lawYear: number;
  months: number[];
  /** Bracket breakdown of the first month's annualized taxable income. */
  table: TaxTable;
};

export type SalaryYearResult = {
  months: SalaryMonthResult[];
  lawGroups: LawGroupResult[];
  totals: {
    salary: number;
    insuranceEmployee: number;
    insuranceEmployer: number;
    damgha: number;
    cuts: number;
    saved: number;
    beforeTax: number;
    personal: number;
    tax: number;
    net: number;
    /** Average net month (source shows المتوسط الشهرى). */
    avgMonthlyNet: number;
    avgMonthlyTax: number;
  };
  limits: InsuranceLimits;
  /** Annual personal exemption for December of the year (display helper). */
  personalExemption: number;
};

/**
 * Source `Mm` + `MD` — the year is computed month by month because both the tax
 * law (e.g. 2024: Jan–Feb on 175/2023, Mar–Dec on 7/2024) and the personal
 * exemption change mid-year.
 */
export function computeSalaryYear(input: SalaryYearInput): SalaryYearResult {
  const { year, sector, calcInsurance } = input;
  // Source page (C5.valueChanged): pre-2020 years have no المدخر, 2020+ have no
  // المتغير — zero the component the chosen year doesn't use.
  const monthly: SalaryMonthInput = {
    primary: input.monthly.primary,
    secondary: year > 2019 ? 0 : input.monthly.secondary,
    saved: year > 2019 ? input.monthly.saved : 0,
    cuts: input.monthly.cuts,
  };
  const months: SalaryMonthResult[] = [];

  for (let m = 1; m <= 12; m++) {
    const insurance = calcInsurance
      ? computeInsurance(year, sector, monthly.primary, monthly.secondary)
      : null;
    const insuranceEmployee = insurance ? insurance.result.employeeTotal : 0;
    const insuranceEmployer = insurance ? insurance.result.companyTotal : 0;
    const insuranceBase = insurance ? r4(insurance.result.basePrimary + insurance.result.baseSecondary) : 0;
    const damgha = sector !== "private" ? computeDamgha(monthly.primary + monthly.secondary) : 0;

    const beforeTax = r4(
      monthly.primary + monthly.secondary - insuranceEmployee - damgha - monthly.cuts + monthly.saved
    );

    const law = getLawByMonth(year, m);
    const personalExemptionAnnual = getPersonalExemption(year, m);
    const personalMonthly = r4(personalExemptionAnnual / 12);

    let taxableMonthly = 0;
    let tax = 0;
    if (beforeTax > 0 && beforeTax >= personalMonthly) {
      taxableMonthly = r4(beforeTax - personalMonthly);
      const annualTaxable = toLeast(taxableMonthly * 12, 10);
      tax = r4(computeTaxTable(annualTaxable, ruleFor(law, annualTaxable)).netTax / 12);
    }

    months.push({
      month: m,
      lawId: law.id,
      lawNumber: law.lawNumber,
      lawYear: law.lawYear,
      salaryTotal: r4(monthly.primary + monthly.secondary),
      insuranceEmployee,
      insuranceEmployer,
      insuranceBase,
      damgha,
      cuts: monthly.cuts,
      saved: monthly.saved,
      beforeTax,
      personalExemptionAnnual,
      personalMonthly,
      taxableMonthly,
      tax,
      net: r4(beforeTax - tax),
      insuranceErrorKind: insurance ? insurance.result.errorKind : null,
    });
  }

  // Group consecutive months by law and keep one representative breakdown.
  const lawGroups: LawGroupResult[] = [];
  for (const month of months) {
    const last = lawGroups[lawGroups.length - 1];
    if (last && last.lawId === month.lawId) {
      last.months.push(month.month);
      continue;
    }
    const annualTaxable = toLeast(month.taxableMonthly * 12, 10);
    lawGroups.push({
      lawId: month.lawId,
      lawNumber: month.lawNumber,
      lawYear: month.lawYear,
      months: [month.month],
      table: computeTaxTable(annualTaxable, ruleFor(getLawByMonth(year, month.month), annualTaxable)),
    });
  }

  const sum = (pick: (m: SalaryMonthResult) => number) => r4(months.reduce((acc, m) => acc + pick(m), 0));
  const totals = {
    salary: sum((m) => m.salaryTotal),
    insuranceEmployee: sum((m) => m.insuranceEmployee),
    insuranceEmployer: sum((m) => m.insuranceEmployer),
    damgha: sum((m) => m.damgha),
    cuts: sum((m) => m.cuts),
    saved: sum((m) => m.saved),
    beforeTax: sum((m) => m.beforeTax),
    personal: sum((m) => m.personalMonthly),
    tax: sum((m) => m.tax),
    net: sum((m) => m.net),
    avgMonthlyNet: r4(sum((m) => m.net) / 12),
    avgMonthlyTax: r4(sum((m) => m.tax) / 12),
  };

  const info = getInsuranceInfo(year, sector);
  return {
    months,
    lawGroups,
    totals,
    limits: { primary: info.primary, secondary: info.secondary },
    personalExemption: getPersonalExemption(year, 12),
  };
}

/* ------------------------------ income tax page ------------------------------ */

export type IncomeYearOption = { value: number; label: string };

/** Source income-page select — exact values and range labels. */
export const INCOME_YEAR_OPTIONS: readonly IncomeYearOption[] = [
  { value: 2026, label: "2026" },
  { value: 2025, label: "2025" },
  { value: 2024, label: "2024" },
  { value: 2023, label: "2023" },
  { value: 2020, label: "2020 - 2022" },
  { value: 2018, label: "2018 - 2019" },
  { value: 2017, label: "2017" },
  { value: 2016, label: "2016" },
  { value: 2015, label: "2015" },
  { value: 2014, label: "2014" },
  { value: 2013, label: "2013" },
  { value: 2011, label: "2011 - 2012" },
  { value: 2005, label: "2005 - 2010" },
];

/** Salary page years — source insurance laws cover 2008–2026. */
export const SALARY_MIN_YEAR = 2008;
export const SALARY_MAX_YEAR = 2026;

export type IncomeResult = {
  lawId: string;
  lawNumber: string;
  lawYear: number;
  table: TaxTable;
  tax: number;
  net: number;
  effectiveRate: number;
};

/** Source `ia.createByYear` — income page: individuals use tiers, companies the flat rule. */
export function computeIncomeTaxByYear(income: number, year: number, isCompany: boolean): IncomeResult {
  const law = getLawByYear(year);
  // Source `ia` constructor floors the income to a multiple of 10 BEFORE the
  // tier rule picks its table — mirror that order exactly.
  const safeIncome = Math.max(0, toLeast(income, 10));
  const table = computeTaxTable(safeIncome, isCompany ? law.company : ruleFor(law, safeIncome));
  const effectiveRate = safeIncome > 0 ? Math.min(1, Math.max(0, table.netTax / safeIncome)) : 0;
  return {
    lawId: law.id,
    lawNumber: law.lawNumber,
    lawYear: law.lawYear,
    table,
    tax: table.netTax,
    net: r4(safeIncome - table.netTax),
    effectiveRate,
  };
}
