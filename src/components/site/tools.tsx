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
  ALLOWANCE_EXEMPT_CAP,
  computeDelayFine,
  computeIncomeTax,
  computePersonalIncomeTax,
  content,
  CORPORATE_TAX_RATE,
  getIncomeTaxBrackets,
  INSURANCE_EMPLOYEE_RATE,
  INSURANCE_EMPLOYER_RATE,
  INSURANCE_LIMITS,
  MAX_CALCULATION_AMOUNT,
  PERSONAL_EXEMPTION,
  TAX_BRACKETS_BY_YEAR,
  TAX_YEARS,
  VAT_FINE_CAP_MONTHS,
  VAT_FINE_MONTHLY_RATE,
  type DelayFineEntry,
} from "@/lib/site-content";
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

function formatRate(rate: number): string {
  const pct = rate * 100;
  return `${pct % 1 === 0 ? pct : pct.toFixed(2)}%`;
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

type BracketRow = { amount: number; rate: number; tax: number; net: number };

function buildBracketRows(taxable: number, year: string, incomeRules = false): BracketRow[] {
  const brackets = incomeRules
    ? getIncomeTaxBrackets(year, taxable)
    : TAX_BRACKETS_BY_YEAR[year] ?? TAX_BRACKETS_BY_YEAR["2026"];
  const rows: BracketRow[] = [];
  const safeTaxable = Number.isFinite(taxable) ? Math.max(0, Math.min(taxable, MAX_AMOUNT)) : 0;
  let lower = 0;
  for (const b of brackets) {
    if (safeTaxable <= lower) break;
    const upper = Number.isFinite(b.upper) ? b.upper : safeTaxable;
    const amount = Math.max(0, Math.min(safeTaxable, upper) - lower);
    if (amount > 0) {
      const tax = Math.round(amount * b.rate * 100) / 100;
      rows.push({ amount, rate: b.rate, tax, net: Math.max(0, Math.round((amount - tax) * 100) / 100) });
    }
    lower = upper;
  }
  return rows;
}

function BracketTable({
  rows,
  totalTax,
  taxable,
  labels,
  year,
}: {
  rows: BracketRow[];
  totalTax: number;
  taxable: number;
  labels: { colBand: string; colRate: string; colTax: string; colNet: string; totalRow: string };
  year: string;
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
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0">
              <td className="p-3 text-start font-bold text-foreground" dir="ltr">
                {formatInt(row.amount)}
              </td>
              <td className="p-3 text-center">
                <span className="text-xs font-black text-primary" dir="ltr">
                  {formatRate(row.rate)}
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
          <tr className="border-t-2 border-gold/50 bg-gold/10">
            <td className="p-3 text-start font-black text-foreground">{labels.totalRow}</td>
            <td className="p-3 text-center text-xs font-bold text-muted-foreground">—</td>
            <td className="p-3 text-center text-base font-black text-gold-2" dir="ltr">
              {formatMoney(totalTax)}
            </td>
            <td className="p-3 text-center font-black text-foreground" dir="ltr">
              {formatMoney(taxable - totalTax)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
        {year}
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

  const [tool, setTool] = React.useState<ToolKey>("payroll");
  /* ------------------------------- shared state ------------------------------ */
  const [year, setYear] = React.useState("2026");
  /* payroll */
  const [mode, setMode] = React.useState<"monthly" | "annual">("monthly");
  const [wage, setWage] = React.useState("");
  const [deductions, setDeductions] = React.useState("");
  const [allowances, setAllowances] = React.useState("");
  const [includeInsurance, setIncludeInsurance] = React.useState(true);
  /* income */
  const [incomeEntity, setIncomeEntity] = React.useState<"individual" | "company">("individual");
  const [netIncome, setNetIncome] = React.useState("");
  /* vat fine */
  const [vfPeriod, setVfPeriod] = React.useState("2016-09-01");
  const [vfAmount, setVfAmount] = React.useState("5000");
  const [vfNotice, setVfNotice] = React.useState("2021-05-07");
  const [vfPayment, setVfPayment] = React.useState(todayISO());
  /* delay fine */
  const [dfEntity, setDfEntity] = React.useState<"individual" | "company">("company");
  const [dfPayment, setDfPayment] = React.useState(todayISO());
  const [dfYear, setDfYear] = React.useState("2020");
  const [dfAmount, setDfAmount] = React.useState("");
  const [dfEntries, setDfEntries] = React.useState<DelayFineEntry[]>([]);

  const p = t.payroll;

  /* ------------------------------ payroll engine ----------------------------- */
  const wageNum = parseAmount(wage);
  const monthlyWage = mode === "monthly" ? wageNum : wageNum / 12;
  const annualWage = monthlyWage * 12;
  const monthlyDeductions = mode === "monthly" ? parseAmount(deductions) : parseAmount(deductions) / 12;
  const monthlyAllowances = mode === "monthly" ? parseAmount(allowances) : parseAmount(allowances) / 12;
  const limits = INSURANCE_LIMITS[year] ?? INSURANCE_LIMITS["2026"];
  const insurableMonthly = includeInsurance
    ? Math.min(
        Math.max(monthlyWage - Math.min(monthlyAllowances, monthlyWage * ALLOWANCE_EXEMPT_CAP), limits.min),
        limits.max
      )
    : 0;
  const employeeInsMonthly = insurableMonthly * INSURANCE_EMPLOYEE_RATE;
  const employerInsMonthly = insurableMonthly * INSURANCE_EMPLOYER_RATE;
  const netAnnualBeforeTax = annualWage - employeeInsMonthly * 12 - monthlyDeductions * 12;
  const taxBase = Math.max(0, netAnnualBeforeTax - PERSONAL_EXEMPTION);
  const annualTax = computeIncomeTax(taxBase, year);
  const netAnnualAfterTax = netAnnualBeforeTax - annualTax;
  const monthlyNet = netAnnualAfterTax / 12;
  const monthlyTax = annualTax / 12;
  const bracketRows = buildBracketRows(taxBase, year);
  const hasWage = wageNum > 0;
  const modeSuffix = `${currency} / ${mode === "monthly" ? p.monthlyCol : p.annualCol}`;

  /* ------------------------------- income engine ------------------------------ */
  const incomeNum = parseAmount(netIncome);
  const isCompany = incomeEntity === "company";
  const incomeTax = isCompany
    ? Math.round(Math.min(incomeNum, MAX_AMOUNT) * CORPORATE_TAX_RATE * 100) / 100
    : computePersonalIncomeTax(incomeNum, year);
  const incomeNet = Math.max(0, incomeNum - incomeTax);
  const effectiveRate = incomeNum > 0 ? Math.min(1, Math.max(0, incomeTax / incomeNum)) : 0;
  const incomeBracketRows = isCompany ? [] : buildBracketRows(incomeNum, year, true);

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
      ? computeDelayFine(dfEntries, dfPaymentDate, dfEntity)
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
                          <Label htmlFor="tax-year" className="text-xs font-bold text-muted-foreground">
                            {p.yearLabel}
                          </Label>
                          <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="tax-year" className={cn("h-9 w-[110px] font-bold", selectTriggerCls)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_YEARS.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <NumberField
                        id="pc-wage"
                        label={`${p.wageLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                        placeholder={p.wagePlaceholder}
                        value={wage}
                        onChange={setWage}
                        suffix={modeSuffix}
                      />
                      <NumberField
                        id="pc-deductions"
                        label={`${p.deductionsLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                        hint={p.deductionsHint}
                        placeholder="0"
                        value={deductions}
                        onChange={setDeductions}
                        suffix={modeSuffix}
                      />
                      <NumberField
                        id="pc-allowances"
                        label={`${p.allowancesLabel} (${mode === "monthly" ? p.monthlyCol : p.annualCol})`}
                        hint={p.allowancesHint}
                        placeholder="0"
                        value={allowances}
                        onChange={setAllowances}
                        suffix={modeSuffix}
                      />

                      <div className="flex items-center justify-between gap-4 border-t border-border py-3.5">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                          <div className="leading-tight">
                            <Label htmlFor="pc-insurance" className="text-sm font-bold text-foreground">
                              {p.insuranceSwitch}
                            </Label>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {p.limitsLabel}: {formatInt(limits.min)} – {formatInt(limits.max)} {currency}
                            </p>
                          </div>
                        </div>
                        <Switch id="pc-insurance" checked={includeInsurance} onCheckedChange={setIncludeInsurance} />
                      </div>

                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 shrink-0 text-gold-2" aria-hidden="true" />
                        {p.exemptionLabel}:{" "}
                        <strong className="font-black text-foreground">
                          {formatInt(PERSONAL_EXEMPTION)} {currency}
                        </strong>
                      </p>
                    </div>

                    <div className="flex flex-col justify-center gap-5 border-t border-border bg-deep-2 p-6 text-cream sm:p-8 lg:border-s lg:border-t-0">
                      {hasWage ? (
                        <>
                          <div>
                            <span className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-cream/50">
                              {p.netMonthlyLabel}
                            </span>
                            <strong className="mt-1 block text-4xl font-black tracking-tight text-gold-metallic sm:text-5xl" dir="ltr">
                              {formatMoney(monthlyNet)}
                              <span className="ms-2 text-lg font-bold text-cream/60">{currency}</span>
                            </strong>
                          </div>
                          <div className="grid grid-cols-1 gap-3 border-t border-cream/10 pt-5 sm:grid-cols-3">
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.monthlyTaxLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(monthlyTax)}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.annualTaxLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(annualTax)}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-cream/50">{p.insuranceMonthlyLabel}</span>
                              <strong className="mt-0.5 block text-lg font-black text-cream" dir="ltr">
                                {formatMoney(employeeInsMonthly)}
                              </strong>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-cream/15 py-3 text-sm">
                            <span className="text-cream/60">{p.taxBaseLabel}</span>
                            <strong className="font-black text-gold-metallic" dir="ltr">
                              {formatInt(taxBase)} {currency}
                            </strong>
                          </div>
                          </>
                      ) : (
                        <p className="py-6 text-center text-sm leading-7 text-cream/50">{p.empty}</p>
                      )}
                    </div>
                  </div>

                  {hasWage ? (
                    <div className="grid gap-0 border-t border-border lg:grid-cols-[1.4fr_1fr]">
                      <div className="p-6 sm:p-8">
                        <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                          <Calculator className="h-4 w-4 text-gold-2" aria-hidden="true" />
                          {p.bracketsTitle} — {year}
                        </h3>
                        <BracketTable rows={bracketRows} totalTax={annualTax} taxable={taxBase} labels={p} year={year} />
                      </div>
                      <div className="border-t border-border bg-muted/40 p-6 sm:p-8 lg:border-s lg:border-t-0">
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
                                  { label: p.insurableWage, m: insurableMonthly },
                                  { label: p.employeeShare, m: employeeInsMonthly },
                                  { label: p.employerShare, m: employerInsMonthly },
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
                          {p.limitsLabel}: {formatInt(limits.min)} – {formatInt(limits.max)} {currency} · {p.annualWageLabel}:{" "}
                          <strong className="font-black text-foreground" dir="ltr">
                            {formatInt(annualWage)} {currency}
                          </strong>
                        </p>
                      </div>
                    </div>
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
                      {!isCompany && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor="inc-year" className="text-xs font-bold text-muted-foreground">
                            {t.income.yearLabel}
                          </Label>
                          <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="inc-year" className={cn("h-9 w-[110px] font-semibold", selectTriggerCls)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_YEARS.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                      {incomeNum > 0 ? (
                        <>
                          <div>
                            <span className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-cream/50">
                              {t.income.resultLabel}
                            </span>
                            <strong className="mt-1 block text-4xl font-black tracking-tight text-gold-metallic sm:text-5xl" dir="ltr">
                              {formatMoney(incomeTax)}
                              <span className="ms-2 text-lg font-bold text-cream/60">{currency}</span>
                            </strong>
                          </div>
                          <div className="space-y-2.5 border-t border-cream/10 pt-5 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-xs font-bold text-cream/50">{t.income.netAfterLabel}</span>
                              <strong className="font-black" dir="ltr">
                                {formatMoney(incomeNet)} {currency}
                              </strong>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-xs font-bold text-cream/50">{t.income.effectiveRateLabel}</span>
                              <strong className="font-black text-gold-metallic" dir="ltr">
                                {formatRate(effectiveRate)}
                              </strong>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="py-6 text-center text-sm leading-7 text-cream/50">{t.income.empty}</p>
                      )}
                    </div>
                  </div>
                  {incomeNum > 0 && !isCompany ? (
                    <div className="border-t border-border p-6 sm:p-8">
                      <h3 className="mb-4 inline-flex items-center gap-2 text-sm font-black text-foreground">
                        <Calculator className="h-4 w-4 text-gold-2" aria-hidden="true" />
                        {t.income.bracketsTitle} — {year}
                      </h3>
                      <BracketTable
                        rows={incomeBracketRows}
                        totalTax={incomeTax}
                        taxable={incomeNum}
                        labels={t.income}
                        year={year}
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
