"use client";

import * as React from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Calculator,
  Clock,
  Info,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import {
  computeDamgha,
  computeIncomeTaxByYear,
  computeSalaryYear,
  getInsuranceInfo,
  INCOME_YEAR_OPTIONS,
  SALARY_MAX_YEAR,
  SALARY_MIN_YEAR,
  type Sector,
  type TaxTable,
} from "@/lib/asma-tax";
import { computeDelayFine, MAX_CALCULATION_AMOUNT, VAT_FINE_CAP_MONTHS, VAT_FINE_MONTHLY_RATE, content } from "@/lib/site-content";
import type { DelayFineEntry } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { ExtArrow, Reveal, SectionHead, btnPrimary } from "./primitives";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* --------------------------------- helpers --------------------------------- */

const MAX_AMOUNT_INPUT_LENGTH = 18;
const MAX_AMOUNT = MAX_CALCULATION_AMOUNT;

function parseAmount(raw: string): number {
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    raw.length > MAX_AMOUNT_INPUT_LENGTH ||
    !/^[\d\s,،٬\u0660-\u0669\u06f0-\u06f9]+$/.test(raw)
  ) {
    return 0;
  }
  const safeNormalized = raw
    .normalize("NFKC")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s,\u060c\u066c]/g, "");
  if (safeNormalized.length >= 0) {
    if (!/^\d+$/.test(safeNormalized)) return 0;
    const amount = Number(safeNormalized);
    return Number.isSafeInteger(amount) ? Math.min(amount, MAX_AMOUNT) : 0;
  }
  const normalized = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d]/g, "");
  return normalized ? parseInt(normalized, 10) : 0;
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.005) return formatInt(rounded);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/** Formats a percent VALUE (22.5 → "22.5%"). */
function formatPct(ratePercent: number): string {
  return `${ratePercent % 1 === 0 ? ratePercent : ratePercent.toFixed(2)}%`;
}

/** Formats a fraction (0.225 → "22.5%"). */
function formatRate(rate: number): string {
  return formatPct(rate * 100);
}

/** Underline-style Select trigger — matches the de-boxed fields (no box, hairline bottom only). */
const selectTriggerCls =
  "rounded-none border-0 border-b-2 border-border/50 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-gold data-[state=open]:border-gold";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthsBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  if (b <= a) return 0;
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() > a.getDate()) months += 1; // partial month counts as a full month
  return Math.max(0, months);
}

function addMonthsISO(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function NumberField({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-foreground/85">
        {label}
      </Label>
      <div className="relative" dir="ltr">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={MAX_AMOUNT_INPUT_LENGTH}
          autoComplete="off"
          dir="ltr"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const n = parseAmount(e.target.value);
            onChange(n ? formatInt(n) : "");
          }}
          className="h-14 w-full border-b-2 border-border/40 bg-transparent px-0 py-3 pe-20 text-start text-base font-black tracking-wide text-foreground transition-colors placeholder:font-medium placeholder:text-muted-foreground/50 focus:border-b-2 focus:border-gold focus:outline-none"
        />
        <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-[11px] font-bold text-muted-foreground">
          {suffix}
        </span>
      </div>
      {hint ? <p className="text-[11px] leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-foreground/85">
        {label}
      </Label>
      <input
        id={id}
        type="date"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full border-b-2 border-border/40 bg-transparent px-0 py-3 text-start text-sm font-bold text-foreground transition-colors placeholder:font-medium placeholder:text-muted-foreground/50 focus:border-b-2 focus:border-gold focus:outline-none"
      />
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { key: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-end gap-x-1 gap-y-1 border-b border-border pb-px">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:text-sm",
            value === o.key
              ? "border-gold-2 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ bracket display ----------------------------- */

function BracketTable({
  table,
  taxable,
  labels,
  footer,
}: {
  table: TaxTable;
  taxable: number;
  labels: { colBand: string; colRate: string; colTax: string; colNet: string; totalRow: string; discountRow: string };
  footer: string;
}) {
  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/60 text-xs">
            <th scope="col" className="p-3 text-start font-extrabold text-foreground/70">
              {labels.colBand}
            </th>
            <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">
              {labels.colRate}
            </th>
            <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">
              {labels.colTax}
            </th>
            <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">
              {labels.colNet}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0">
              <td className="p-3 text-start font-bold text-foreground" dir="ltr">
                {formatInt(row.amount)}
              </td>
              <td className="p-3 text-center">
                <span className="text-xs font-black text-primary" dir="ltr">
                  {row.rate === null ? "%" : formatPct(row.rate)}
                </span>
              </td>
              <td className="p-3 text-center font-black text-foreground" dir="ltr">
                {formatMoney(row.tax)}
              </td>
              <td className="p-3 text-center font-bold text-muted-foreground" dir="ltr">
                {formatMoney(row.net)}
              </td>
            </tr>
          ))}
          {table.discountRate !== null ? (
            <tr className="border-b border-border/70">
              <td className="p-3 text-start font-bold text-primary" dir="ltr">{table.rows.length}</td>
              <td className="p-3 text-center">
                <span className="text-xs font-black text-primary" dir="ltr">
                  −{formatPct(table.discountRate)}
                </span>
              </td>
              <td className="p-3 text-center font-black text-primary" dir="ltr">
                −{formatMoney(table.discount)}
              </td>
              <td className="p-3 text-center text-muted-foreground">—</td>
            </tr>
          ) : null}
          <tr className="border-t-2 border-gold/50 bg-gold/10">
            <td className="p-3 text-start font-black text-foreground">{labels.totalRow}</td>
            <td className="p-3 text-center text-xs font-bold text-muted-foreground">—</td>
            <td className="p-3 text-center text-base font-black text-gold-2" dir="ltr">
              {formatMoney(table.netTax)}
            </td>
            <td className="p-3 text-center font-black text-foreground" dir="ltr">
              {formatMoney(taxable - table.netTax)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
        {footer}
      </p>
    </div>
  );
}

/* ================================= main ================================= */

type ToolKey = "payroll" | "income" | "vatFine" | "delayFine";

export function Calculators() {
  const { lang } = useLang();
  const t = content[lang].calc;
  const currency = content[lang].currency;
  const monthFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", { month: "short" }),
    [lang]
  );

  const [tool, setTool] = React.useState<ToolKey>("payroll");
  /* ------------------------------- payroll state ------------------------------ */
  const [mode, setMode] = React.useState<"monthly" | "annual">("monthly");
  const [year, setYear] = React.useState(SALARY_MAX_YEAR);
  const [sector, setSector] = React.useState<Sector>("private");
  const [primary, setPrimary] = React.useState("");
  const [secondary, setSecondary] = React.useState("");
  const [saved, setSaved] = React.useState("");
  const [cuts, setCuts] = React.useState("");
  const [includeInsurance, setIncludeInsurance] = React.useState(true);
  /* -------------------------------- income state ------------------------------- */
  const [incomeEntity, setIncomeEntity] = React.useState<"individual" | "company">("individual");
  const [incomeYear, setIncomeYear] = React.useState(INCOME_YEAR_OPTIONS[0].value);
  const [netIncome, setNetIncome] = React.useState("");
  /* -------------------------------- vat fine -------------------------------- */
  const [vfPeriod, setVfPeriod] = React.useState("2016-09-01");
  const [vfAmount, setVfAmount] = React.useState("5000");
  const [vfNotice, setVfNotice] = React.useState("2021-05-07");
  const [vfPayment, setVfPayment] = React.useState(todayISO());
  /* ------------------------------- delay fine ------------------------------- */
  const [dfEntity, setDfEntity] = React.useState<"individual" | "company">("company");
  const [dfPayment, setDfPayment] = React.useState(todayISO());
  const [dfYear, setDfYear] = React.useState("2020");
  const [dfAmount, setDfAmount] = React.useState("");
  const [dfEntries, setDfEntries] = React.useState<DelayFineEntry[]>([]);

  const p = t.payroll;

  /* ------------------------------ payroll engine ----------------------------- */
  // Mirrors the source page: clamp savings to 30% of the wage first, then divide
  // annual inputs by 12, then zero the component the chosen year doesn't use.
  const primaryInput = parseAmount(primary);
  const secondaryInput = parseAmount(secondary);
  const savedInput = Math.min(parseAmount(saved), Math.floor(primaryInput * 0.3));
  const cutsInput = parseAmount(cuts);
  const isNewInsurance = year > 2019;
  const toMonthly = (v: number) => (mode === "monthly" ? v : v / 12);
  const salaryResult = React.useMemo(() => {
    if (primaryInput <= 0) return null;
    try {
      return computeSalaryYear({
        year,
        sector,
        monthly: {
          primary: toMonthly(primaryInput),
          secondary: isNewInsurance ? 0 : toMonthly(secondaryInput),
          saved: isNewInsurance ? toMonthly(savedInput) : 0,
          cuts: toMonthly(cutsInput),
        },
        calcInsurance: includeInsurance,
      });
    } catch {
      return null;
    }
  }, [year, sector, primaryInput, secondaryInput, savedInput, cutsInput, includeInsurance, mode, isNewInsurance]);

  const insuranceInfo = React.useMemo(() => {
    try {
      return getInsuranceInfo(year, sector);
    } catch {
      return null;
    }
  }, [year, sector]);
  const insPctLabel = (share: { primary: number; secondary: number }) =>
    share.secondary > 0 ? `${share.primary}% + ${share.secondary}%` : `${share.primary}%`;
  const hasWage = primaryInput > 0 && salaryResult !== null;
  const insError = salaryResult?.months[0].insuranceErrorKind ?? null;
  const insErrorMessage =
    salaryResult && insError === "primary"
      ? `${isNewInsurance ? p.insInvalidPrimaryNew : p.insInvalidPrimaryOld} ${formatMoney(salaryResult.limits.primary.low)} ${currency}`
      : salaryResult && insError === "total"
        ? `${p.insInvalidTotal} ${formatMoney(salaryResult.limits.primary.low + salaryResult.limits.secondary.low)} ${currency}`
        : null;
  const modeSuffix = `${currency} / ${mode === "monthly" ? p.monthlyCol : p.annualCol}`;
  const salaryYears = React.useMemo(
    () => Array.from({ length: SALARY_MAX_YEAR - SALARY_MIN_YEAR + 1 }, (_, i) => SALARY_MAX_YEAR - i),
    []
  );

  /* ------------------------------- income engine ------------------------------ */
  const incomeNum = parseAmount(netIncome);
  const isCompany = incomeEntity === "company";
  const incomeResult = React.useMemo(() => {
    if (incomeNum <= 0) return null;
    try {
      return computeIncomeTaxByYear(incomeNum, incomeYear, isCompany);
    } catch {
      return null;
    }
  }, [incomeNum, incomeYear, isCompany]);

  /* ------------------------------ vat fine engine ----------------------------- */
  const vfAmountNum = parseAmount(vfAmount);
  const vfHasInput = vfAmountNum > 0 && !!vfPeriod && !!vfNotice && !!vfPayment && vfNotice <= vfPayment;
  const part1Start = vfHasInput ? addMonthsISO(vfPeriod, 1) : "";
  const part1Months = vfHasInput ? Math.min(monthsBetween(part1Start, vfNotice), VAT_FINE_CAP_MONTHS) : 0;
  const part1Fine = vfHasInput ? vfAmountNum * VAT_FINE_MONTHLY_RATE * part1Months : 0;
  const part2Months = vfHasInput ? monthsBetween(vfNotice, vfPayment) : 0;
  const part2Fine = vfHasInput ? vfAmountNum * VAT_FINE_MONTHLY_RATE * part2Months : 0;
  const vfTotal = part1Fine + part2Fine;

  /* ----------------------------- delay fine engine ---------------------------- */
  // Guard against an empty/invalid payment date so the engine never receives
  // an Invalid Date (which would surface NaN values in the results table).
  const dfPaymentDate = dfPayment ? new Date(dfPayment + "T00:00:00") : null;
  const dfResult =
    dfPaymentDate && !Number.isNaN(dfPaymentDate.getTime())
      ? computeDelayFineSafe(dfEntries, dfPaymentDate, dfEntity)
      : { rows: [], totalFine: 0, totalBalance: 0 };

  const tools: { key: ToolKey; label: string; icon: React.ReactNode }[] = [
    { key: "payroll", label: t.tabs.payroll, icon: <Wallet className="h-4 w-4" aria-hidden="true" /> },
    { key: "income", label: t.tabs.income, icon: <Banknote className="h-4 w-4" aria-hidden="true" /> },
    { key: "vatFine", label: t.tabs.vatFine, icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" /> },
    { key: "delayFine", label: t.tabs.delayFine, icon: <Clock className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <section id="tools" className="relative isolate scroll-mt-24 overflow-hidden border-y border-primary/10 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative">
          <SectionHead align="center" eyebrow={t.eyebrow} title={t.title} sub={t.sub} />

          <Reveal delay={0.15}>
            <div
              role="tablist"
              aria-label={t.title}
              className="mx-auto mt-10 flex w-full max-w-full snap-x gap-x-7 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-fit sm:flex-wrap sm:justify-center sm:gap-x-8 sm:overflow-visible"
            >
              {tools.map((tl) => (
                <button
                  key={tl.key}
                  role="tab"
                  aria-selected={tool === tl.key}
                  onClick={() => setTool(tl.key)}
                  className={cn(
                    "relative -mb-px inline-flex shrink-0 snap-start items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors",
                    tool === tl.key
                      ? "border-gold-2 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tl.icon}
                  {tl.label}
                </button>
              ))}
            </div>
          </Reveal>

            {/* ------------------------------- PAYROLL ------------------------------- */}
            {tool === "payroll" && (
              <Reveal delay={0.05}>
                <div className="mt-8 border-t border-border bg-card/95">
                  <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-5 p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <Segmented
                          ariaLabel={p.modeMonthly}
                          options={[
                            { key: "monthly", label: p.modeMonthly },
                            { key: "annual", label: p.modeAnnual },
                          ]}
                          value={mode}
                          onChange={setMode}
                        />
                        <div className="flex items-center gap-2">
                          <Label htmlFor="pc-year" className="text-xs font-bold text-muted-foreground">
                            {p.yearLabel}
                          </Label>
                          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger id="pc-year" className={cn("h-9 w-[110px] font-bold", selectTriggerCls)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {salaryYears.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-muted-foreground">{p.sectorLabel}</Label>
                        <Segmented
                          ariaLabel={p.sectorLabel}
                          options={[
                            { key: "private", label: p.sectorPrivate },
                            { key: "public", label: p.sectorPublic },
                            { key: "goverment", label: p.sectorGoverment },
                          ]}
                          value={sector}
                          onChange={setSector}
                        />
                      </div>

                      <NumberField
                        id="pc-primary"
                        label={`${isNewInsurance ? p.primaryLabel : p.primaryOldLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                        placeholder={p.primaryPlaceholder}
                        value={primary}
                        onChange={setPrimary}
                        suffix={modeSuffix}
                      />
                      {!isNewInsurance && (
                        <NumberField
                          id="pc-secondary"
                          label={`${p.secondaryLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                          hint={p.secondaryHint}
                          placeholder="0"
                          value={secondary}
                          onChange={setSecondary}
                          suffix={modeSuffix}
                        />
                      )}
                      {isNewInsurance && (
                        <NumberField
                          id="pc-saved"
                          label={`${p.savedLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                          hint={p.savedHint}
                          placeholder="0"
                          value={saved}
                          onChange={setSaved}
                          suffix={modeSuffix}
                        />
                      )}
                      <NumberField
                        id="pc-cuts"
                        label={`${p.cutsLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                        hint={p.cutsHint}
                        placeholder="0"
                        value={cuts}
                        onChange={setCuts}
                        suffix={modeSuffix}
                      />

                      <div className="flex items-center justify-between gap-4 border-t border-border py-3.5">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                          <div className="leading-tight">
                            <Label htmlFor="pc-insurance" className="text-sm font-bold text-foreground">
                              {p.insuranceSwitch}
                            </Label>
                            {insuranceInfo ? (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {p.limitsLabel}: {formatMoney(insuranceInfo.primary.low)} – {formatMoney(insuranceInfo.primary.high)}{" "}
                                {currency}
                                {!isNewInsurance && insuranceInfo.secondary.high > 0
                                  ? ` · ${formatMoney(insuranceInfo.secondary.low)} – ${formatMoney(insuranceInfo.secondary.high)} ${currency}`
                                  : null}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <Switch id="pc-insurance" checked={includeInsurance} onCheckedChange={setIncludeInsurance} />
                      </div>

                      {sector !== "private" ? (
                        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                          {p.damghaNote}
                        </p>
                      ) : null}

                      {hasWage ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                          {p.exemptionLabel}:{" "}
                          <strong className="font-black text-foreground">
                            {formatInt(salaryResult.personalExemption)} {currency}
                          </strong>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col justify-center gap-5 border-t border-border bg-deep-2 p-6 text-cream sm:p-8 lg:border-s lg:border-t-0">
                      {hasWage ? (
                        <>
                          <div>
                            <span className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-cream/50">
                              {p.netMonthlyLabel}
                            </span>
                            <strong className="mt-1 block text-4xl font-black tracking-tight text-gold-metallic sm:text-5xl" dir="ltr">
                              {formatMoney(salaryResult.totals.avgMonthlyNet)}
                              <span className="ms-2 text-lg font-bold text-cream/60">{currency}</span>
                            </strong>
                          </div>
                          <div className="grid grid-cols-1 gap-3 border-t border-cream/10 pt-5 sm:grid-cols-3">
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.monthlyTaxLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(salaryResult.totals.avgMonthlyTax)}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.annualTaxLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(salaryResult.totals.tax)}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.insuranceMonthlyLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(salaryResult.totals.insuranceEmployee / 12)}
                              </strong>
                            </div>
                          </div>
                          {sector !== "private" ? (
                            <div className="flex items-center justify-between gap-3 border-t border-cream/15 py-3 text-sm">
                              <span className="text-cream/60">{p.damghaMonthlyLabel}</span>
                              <strong className="font-black text-gold-metallic" dir="ltr">
                                {formatMoney(salaryResult.totals.damgha / 12)} {currency}
                              </strong>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="py-6 text-center text-sm leading-7 text-cream/50">{p.empty}</p>
                      )}
                    </div>
                  </div>

                  {hasWage ? (
                    <>
                      {insErrorMessage ? (
                        <p className="flex items-start gap-2 border-t border-destructive/30 bg-destructive/10 px-6 py-3 text-xs font-bold leading-5 text-destructive sm:px-8">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {insErrorMessage}
                        </p>
                      ) : null}

                      {/* month-by-month table */}
                      <div className="border-t border-border p-6 sm:p-8">
                        <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                          <Calculator className="h-4 w-4 text-gold-2" aria-hidden="true" />
                          {p.monthsTitle} — {year}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] border-collapse text-sm">
                            <thead>
                              <tr className="border-b bg-muted/60 text-xs">
                                <th scope="col" className="p-3 text-start font-extrabold text-foreground/70">{p.monthCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.salaryCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.insuranceCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.damghaCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.beforeTaxCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.personalCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.taxableCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.taxCol}</th>
                                <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.netCol}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salaryResult.months.map((m) => (
                                <tr key={m.month} className="border-b border-border/70 last:border-0">
                                  <td className="p-3 text-start font-bold text-foreground">{monthFormatter.format(new Date(2024, m.month - 1, 1))}</td>
                                  <td className="p-3 text-center font-bold text-foreground" dir="ltr">{formatMoney(m.salaryTotal)}</td>
                                  <td className="p-3 text-center font-bold text-foreground" dir="ltr">{formatMoney(m.insuranceEmployee)}</td>
                                  <td className="p-3 text-center font-bold text-foreground" dir="ltr">{formatMoney(m.damgha)}</td>
                                  <td className="p-3 text-center font-bold text-foreground" dir="ltr">{formatMoney(m.beforeTax)}</td>
                                  <td className="p-3 text-center font-bold text-muted-foreground" dir="ltr">{formatMoney(m.personalMonthly)}</td>
                                  <td className="p-3 text-center font-bold text-muted-foreground" dir="ltr">{formatMoney(m.taxableMonthly)}</td>
                                  <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(m.tax)}</td>
                                  <td className="p-3 text-center font-black text-gold-2" dir="ltr">{formatMoney(m.net)}</td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-gold/50 bg-gold/10">
                                <td className="p-3 text-start font-black text-foreground">{p.totalRow}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(salaryResult.totals.salary)}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(salaryResult.totals.insuranceEmployee)}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(salaryResult.totals.damgha)}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(salaryResult.totals.beforeTax)}</td>
                                <td className="p-3 text-center font-bold text-foreground" dir="ltr">{formatMoney(salaryResult.totals.personal)}</td>
                                <td className="p-3 text-center font-bold text-muted-foreground">—</td>
                                <td className="p-3 text-center text-base font-black text-gold-2" dir="ltr">{formatMoney(salaryResult.totals.tax)}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(salaryResult.totals.net)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* bracket tables — one per law when the law changes mid-year */}
                      <div className="grid min-w-0 gap-0 border-t border-border lg:grid-cols-[1.4fr_1fr]">
                        <div className="min-w-0 p-6 sm:p-8">
                          <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                            <Calculator className="h-4 w-4 text-gold-2" aria-hidden="true" />
                            {p.bracketsTitle} — {year}
                          </h3>
                          <div className="space-y-6">
                            {salaryResult.lawGroups.map((group) => (
                              <BracketTable
                                key={group.lawId}
                                table={group.table}
                                taxable={group.table.rows.reduce((acc, r) => acc + r.amount, 0)}
                                labels={p}
                                footer={`${p.lawLabel} ${group.lawNumber} ${lang === "ar" ? "لسنة" : "of"} ${group.lawYear} · ${group.months
                                  .map((m) => monthFormatter.format(new Date(2024, m - 1, 1)))
                                  .join(" · ")}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="min-w-0 border-t border-border bg-muted/40 p-6 sm:p-8 lg:border-s lg:border-t-0">
                          <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                            {p.insuranceTitle}
                          </h3>
                          {includeInsurance ? (
                            <div className="overflow-x-auto border-t border-border">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/60 text-xs">
                                    <th scope="col" className="p-3 text-start font-extrabold text-foreground/70">—</th>
                                    <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.monthlyCol}</th>
                                    <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{p.annualCol}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    {
                                      label: `${p.insurableWage}`,
                                      m: salaryResult.months[0].insuranceBase,
                                    },
                                    {
                                      label: `${p.employeeShare} (${insPctLabel(insuranceInfo?.employee ?? { primary: 0, secondary: 0 })})`,
                                      m: salaryResult.months[0].insuranceEmployee,
                                    },
                                    {
                                      label: `${p.employerShare} (${insPctLabel(insuranceInfo?.company ?? { primary: 0, secondary: 0 })})`,
                                      m: salaryResult.months[0].insuranceEmployer,
                                    },
                                  ].map((row) => (
                                    <tr key={row.label} className="border-b border-border/70 last:border-0">
                                      <th scope="row" className="p-3 text-start text-xs font-bold text-foreground/85">
                                        {row.label}
                                      </th>
                                      <td className="p-3 text-center font-black text-foreground" dir="ltr">
                                        {formatMoney(row.m)}
                                      </td>
                                      <td className="p-3 text-center font-bold text-muted-foreground" dir="ltr">
                                        {formatMoney(row.m * 12)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="border-t border-dashed border-border pt-4 text-center text-xs leading-6 text-muted-foreground">
                              {p.insuranceSwitch} — {p.monthlyCol}: 0
                            </p>
                          )}
                          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
                            {p.annualWageLabel}:{" "}
                            <strong className="font-black text-foreground" dir="ltr">
                              {formatMoney(salaryResult.totals.salary)} {currency}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </Reveal>
            )}

            {/* -------------------------------- INCOME -------------------------------- */}
            {tool === "income" && (
              <Reveal delay={0.05}>
               <div className="mt-8 border-t border-border bg-card/95">
                   <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                     <div className="space-y-5 p-6 sm:p-8">
                       <Segmented
                        ariaLabel={t.income.individual}
                        options={[
                          { key: "individual", label: t.income.individual, icon: <User className="h-3.5 w-3.5" aria-hidden="true" /> },
                          { key: "company", label: t.income.company, icon: <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> },
                        ]}
                        value={incomeEntity}
                        onChange={setIncomeEntity}
                      />
                      <div className="flex items-center gap-2">
                        <Label htmlFor="inc-year" className="text-xs font-bold text-muted-foreground">
                          {t.income.yearLabel}
                        </Label>
                        <Select value={String(incomeYear)} onValueChange={(v) => setIncomeYear(Number(v))}>
                          <SelectTrigger id="inc-year" className={cn("h-9 w-[150px] font-semibold", selectTriggerCls)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_YEAR_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <NumberField
                        id="inc-net"
                        label={`${t.income.netIncomeLabel} (${currency})`}
                        placeholder={t.income.netIncomePlaceholder}
                        value={netIncome}
                        onChange={setNetIncome}
                        suffix={currency}
                      />
                      {isCompany && (
                        <p className="flex items-center gap-2 text-xs leading-6 text-muted-foreground">
                          <Info className="h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                          {t.income.companyNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-5 border-t border-border bg-deep-2 p-6 text-cream sm:p-8 lg:border-s lg:border-t-0">
                      {incomeResult ? (
                        <>
                          <div>
                            <span className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-cream/50">
                              {t.income.resultLabel}
                            </span>
                            <strong className="mt-1 block text-4xl font-black tracking-tight text-gold-metallic sm:text-5xl" dir="ltr">
                              {formatMoney(incomeResult.tax)}
                              <span className="ms-2 text-lg font-bold text-cream/60">{currency}</span>
                            </strong>
                          </div>
                          <div className="space-y-2.5 border-t border-cream/10 pt-5 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-xs font-bold text-cream/50">{t.income.netAfterLabel}</span>
                              <strong className="font-black" dir="ltr">
                                {formatMoney(incomeResult.net)} {currency}
                              </strong>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-xs font-bold text-cream/50">{t.income.effectiveRateLabel}</span>
                              <strong className="font-black text-gold-metallic" dir="ltr">
                                {formatRate(incomeResult.effectiveRate)}
                              </strong>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="py-6 text-center text-sm leading-7 text-cream/50">{t.income.empty}</p>
                      )}
                    </div>
                  </div>
                  {incomeResult ? (
                    <div className="border-t border-border p-6 sm:p-8">
                      <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                        <Calculator className="h-4 w-4 text-gold-2" aria-hidden="true" />
                        {t.income.bracketsTitle} — {INCOME_YEAR_OPTIONS.find((o) => o.value === incomeYear)?.label ?? incomeYear}
                      </h3>
                      <BracketTable
                        table={incomeResult.table}
                        taxable={incomeNum}
                        labels={t.income}
                        footer={`${t.income.lawLabel} ${incomeResult.lawNumber} ${lang === "ar" ? "لسنة" : "of"} ${incomeResult.lawYear}`}
                      />
                    </div>
                  ) : null}
                </div>
              </Reveal>
            )}

            {/* ------------------------------ VAT FINE ------------------------------ */}
            {tool === "vatFine" && (
              <Reveal delay={0.05}>
                 <div className="mx-auto mt-8 max-w-4xl border-t border-border bg-card/95">
                   <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-2">
                    <DateField id="vf-period" label={t.vatFine.periodLabel} value={vfPeriod} onChange={setVfPeriod} />
                    <NumberField
                      id="vf-amount"
                      label={t.vatFine.amountLabel}
                      placeholder={t.vatFine.amountPlaceholder}
                      value={vfAmount}
                      onChange={setVfAmount}
                      suffix={currency}
                    />
                    <DateField id="vf-notice" label={t.vatFine.noticeLabel} value={vfNotice} onChange={setVfNotice} />
                    <DateField id="vf-payment" label={t.vatFine.paymentLabel} value={vfPayment} onChange={setVfPayment} />
                  </div>

                  {vfHasInput ? (
                    <div className="border-t border-border">
                      <div className="grid gap-0 md:grid-cols-2">
                        {/* part 1 */}
                        <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-e">
                          <h3 className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-foreground/70">
                            {t.vatFine.part1Title}
                          </h3>
                          <dl className="mt-4 space-y-2.5 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part1From}</dt>
                              <dd className="font-black text-foreground" dir="ltr">{part1Start}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part1Months}</dt>
                              <dd className="font-black text-foreground" dir="ltr">{part1Months}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part1Fine}</dt>
                              <dd className="text-lg font-black text-gold-2" dir="ltr">
                                {formatMoney(part1Fine)} {currency}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        {/* part 2 */}
                        <div className="p-6 sm:p-8">
                          <h3 className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-foreground/70">
                            {t.vatFine.part2Title}
                          </h3>
                          <dl className="mt-4 space-y-2.5 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part2From}</dt>
                              <dd className="font-black text-foreground" dir="ltr">{vfNotice}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part2To}</dt>
                              <dd className="font-black text-foreground" dir="ltr">{vfPayment}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part2Months}</dt>
                              <dd className="font-black text-foreground" dir="ltr">{part2Months}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted-foreground">{t.vatFine.part2Fine}</dt>
                              <dd className="text-lg font-black text-gold-2" dir="ltr">
                                {formatMoney(part2Fine)} {currency}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border bg-deep-2 px-6 py-5 text-cream sm:px-8">
                        <span className="text-sm font-bold text-cream/70">{t.vatFine.totalLabel}</span>
                        <strong className="text-2xl font-black tracking-tight text-gold-metallic sm:text-3xl" dir="ltr">
                          {formatMoney(vfTotal)} {currency}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="border-t border-border p-6 text-center text-sm leading-7 text-muted-foreground">
                      {t.vatFine.empty}
                    </p>
                  )}
                  <p className="flex items-start gap-2 border-t border-border bg-muted/40 px-6 py-3 text-[11px] leading-5 text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                    {t.vatFine.note}
                  </p>
                </div>
              </Reveal>
            )}

            {/* ------------------------------ DELAY FINE ------------------------------ */}
            {tool === "delayFine" && (
              <Reveal delay={0.05}>
                 <div className="mx-auto mt-8 max-w-5xl border-t border-border bg-card/95">
                   <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-3">
                    <div>
                      <Label className="mb-2 block text-sm font-bold text-foreground/85">{t.delayFine.entityLabel}</Label>
                      <Segmented
                        ariaLabel={t.delayFine.entityLabel}
                        options={[
                          { key: "individual", label: t.delayFine.individual, icon: <User className="h-3.5 w-3.5" aria-hidden="true" /> },
                          { key: "company", label: t.delayFine.company, icon: <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> },
                        ]}
                        value={dfEntity}
                        onChange={setDfEntity}
                      />
                    </div>
                    <DateField id="df-payment" label={t.delayFine.paymentLabel} value={dfPayment} onChange={setDfPayment} />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setDfEntries([])}
                        disabled={dfEntries.length === 0}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] border border-destructive/40 px-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t.delayFine.clearAll}
                      </button>
                    </div>
                  </div>

                  {/* add entry */}
                  <div className="grid gap-4 border-t border-border bg-muted/40 p-6 sm:px-8 md:grid-cols-[180px_1fr_auto] md:items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="df-year" className="text-sm font-bold text-foreground/85">
                        {t.delayFine.yearLabel}
                      </Label>
                      <Select value={dfYear} onValueChange={setDfYear}>
                        <SelectTrigger id="df-year" className={cn("h-12 w-full font-semibold", selectTriggerCls)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 22 }, (_, i) => 2026 - i).map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <NumberField
                      id="df-amount"
                      label={t.delayFine.amountLabel}
                      placeholder={t.delayFine.amountPlaceholder}
                      value={dfAmount}
                      onChange={setDfAmount}
                      suffix={currency}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = parseAmount(dfAmount);
                        if (n <= 0) return;
                        setDfEntries((prev) => [...prev, { id: crypto.randomUUID(), year: Number(dfYear), amount: n }]);
                        setDfAmount("");
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] bg-gold-metallic px-6 text-sm font-bold text-on-gold transition-[filter] hover:brightness-105 active:translate-y-px"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {t.delayFine.addBtn}
                    </button>
                  </div>

                  {/* entries chips */}
                  {dfEntries.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4 sm:px-8">
                      {dfEntries.map((e) => (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-2 rounded-[4px] border border-primary/40 py-1 pe-1.5 ps-3 text-xs font-bold text-primary"
                        >
                          {e.year}: {formatInt(e.amount)} {currency}
                          <button
                            type="button"
                            onClick={() => setDfEntries((prev) => prev.filter((x) => x.id !== e.id))}
                            aria-label={`${t.delayFine.removeBtn} ${e.year}`}
                            className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-primary/15 transition-colors hover:bg-primary/25"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* results table */}
                  {dfEntries.length > 0 && dfResult.rows.length > 0 ? (
                      <div className="border-t border-border p-6 sm:p-8">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[640px] border-collapse text-sm">
                          <thead>
                            <tr className="border-b bg-muted/60 text-xs">
                              <th scope="col" className="p-3 text-start font-extrabold text-foreground/70">{t.delayFine.colStart}</th>
                              <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{t.delayFine.colMonths}</th>
                              <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{t.delayFine.colRate}</th>
                              <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{t.delayFine.colEntry}</th>
                              <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{t.delayFine.colBalance}</th>
                              <th scope="col" className="p-3 text-center font-extrabold text-foreground/70">{t.delayFine.colFine}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dfResult.rows.map((row, i) => (
                              <tr key={i} className="border-b border-border/70 last:border-0">
                                <td className="p-3 text-start font-bold text-foreground" dir="ltr">{row.periodStart}</td>
                                <td className="p-3 text-center font-bold text-foreground" dir="ltr">{row.months}</td>
                                <td className="p-3 text-center">
                                  <span className="text-xs font-black text-primary" dir="ltr">
                                    {formatRate(row.rate)}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-foreground" dir="ltr">
                                  {row.entryAmount ? formatInt(row.entryAmount) : "—"}
                                </td>
                                <td className="p-3 text-center font-bold text-muted-foreground" dir="ltr">{formatInt(row.balance)}</td>
                                <td className="p-3 text-center font-black text-foreground" dir="ltr">{formatMoney(row.fine)}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-gold/50 bg-gold/10">
                              <td className="p-3 text-start font-black text-foreground" colSpan={5}>
                                {t.delayFine.totalRow} — {t.delayFine.balanceLabel}: {formatInt(dfResult.totalBalance)} {currency}
                              </td>
                              <td className="p-3 text-center text-base font-black text-gold-2" dir="ltr">
                                {formatMoney(dfResult.totalFine)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="border-t border-border p-6 text-center text-sm leading-7 text-muted-foreground">
                      {t.delayFine.empty}
                    </p>
                  )}
                  <p className="flex items-start gap-2 border-t border-border bg-muted/40 px-6 py-3 text-[11px] leading-5 text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                    {t.delayFine.note}
                  </p>
                </div>
              </Reveal>
            )}

            <Reveal delay={0.15}>
              <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-5">
                <p className="flex items-start gap-2 text-center text-xs leading-6 text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                  {t.disclaimer}
                </p>
                <a href="#contact" className={btnPrimary}>
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  {t.cta}
                  <ExtArrow />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
    </section>
  );
}

/* ------------------------------- delay fine --------------------------------- */

function computeDelayFineSafe(
  entries: DelayFineEntry[],
  paymentDate: Date,
  entityType: "individual" | "company"
): { rows: DelayFineRowView[]; totalFine: number; totalBalance: number } {
  try {
    return computeDelayFine(entries, paymentDate, entityType);
  } catch {
    return { rows: [], totalFine: 0, totalBalance: 0 };
  }
}

type DelayFineRowView = {
  periodStart: string;
  months: number;
  rate: number;
  entryAmount: number;
  balance: number;
  fine: number;
};
