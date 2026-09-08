## Goal
Replace the tax logic in the site's calculators (Payroll كسب العمل + Income ضريبة الدخل tabs) with a 100% faithful port of ASMA Systems' engine (`https://asma-systems.com/others/tax/income` + its `/salary` page), extracted verbatim from their app bundle (`main.9fb5546c86cc7c19.js`). VAT-fine and delay-fine tabs stay as-is.

## What ASMA's engine actually does (extracted from the bundle)

**Income page** (`/others/tax/income`): أفراد/شركات toggle + صافى الدخل + year select (2026, 2025, 2024, 2023, 2020–2022, 2018–2019, 2017, 2016, 2015, 2014, 2013, 2011, 2005). Income is floored to a multiple of 10, split into bands, and for laws 2017/2018 a discount (خصم) of 80/85%·45/40%·7.5/5% of the tax applies depending on the last band reached. High incomes (2020+ laws) switch to reduced band tables (>600k/700k/800k/900k/1.2M thresholds). Company = flat 22.5% (2024/2023/2020), flat 25% (2013/2012), banded 25%/30% above 1M (2014), banded 20%/25% above 10M (2011), flat 20% (2005).

**Salary page** (كسب عمل): year (2008–2026) + sector (خاص/قطاع عام/حكومي) + monthly-or-annual input of: الأجر الأساسي, المتغير (zeroed for ≥2020), المدخر (zeroed for ≤2019, capped at floor(30% × primary)), استقطاعات. For each of the 12 months separately:
1. Insurance (by calendar year law): validity `primary ≥ primaryLow` and `primary+secondary ≥ primaryLow+secondaryLow`; base = min-capped; employee 11% (≥2020) or 14%+11% split (<2020); employer 18.75/18.25/17.25% by sector (≥2020) or 26%+24% (<2020).
2. Damgha (دمغة، non-private sectors only): tiered rate on (total − 50), rounded **up** to nearest 0.05.
3. beforeTax = primary+secondary − employeeInsurance − damgha − cuts + saved.
4. Law picked **per month** by start date (e.g. 2024: Jan–Feb → Law 175/2023, Mar–Dec → Law 7/2024) and personal exemption per month (4000/7000/9000/15000/20000 by date).
5. If beforeTax < exemption/12 → no tax. Else taxable = beforeTax − exemption/12; annual = taxable×12 (floor to 10); tax = bracket calc incl. discounts; monthly tax = netTax/12.

All arithmetic at 4-decimal internal precision (their Decimal class), display 2 decimals.

## Changes

### 1. New file `src/lib/asma-tax.ts` (pure, data-only engine)
- Law table **verbatim** from the bundle: `t2024` (law 7/2024, from 2024-03-01, bands 40k/55k/70k/200k/400k @ 0/10/15/20/22.5/25% + 5 high-income tiers up to 27.5%), `t2023_2` (175/2023, from 2023-11-01), `t2023` (30/2023, from 2023-07-01, 7 bands incl. 2.5%), `t2020` (26/2020), `t2018` (97/2018, cuts 0/85/45/7.5/0%), `t2017` (82/2017, cuts 0/80/40/5/0), `t2016`, `t2015`, `t2014` (incl. 25/30% top), `t2013`, `t2012`, `t2011` (banded company 20/25%), `t2005`.
- `getLawByYear` / `getLawByMonth` / `getPersonalExemption` with the exact year mappings and inclusive date comparisons.
- Insurance law table 2008–2026 (`fn(primaryLow, primaryHigh, secondaryLow, secondaryHigh)`) + sector percent rules; damgha tier function with ceil-to-0.05.
- `computeTaxTable(income, bracketSet)` returning per-band rows, tax, discount, netTax; `computeSalaryYear(...)` returning 12 month rows + annual totals; salary preprocessing (÷12 for annual input, 30% saved cap, zeroing rules).
- Structure mirrors ASMA 1:1 so future ASMA updates = editing one data entry (add law + start date), no logic changes.

### 2. `src/lib/site-content.ts`
- Delete now-obsolete: `TAX_BRACKETS_BY_YEAR`, `INCOME_TAX_RULESETS_BY_YEAR` + validators/getters, `computeIncomeTax`, `computePersonalIncomeTax`, `PERSONAL_EXEMPTION`, `INSURANCE_LIMITS`, `INSURANCE_EMPLOYEE_RATE`, `INSURANCE_EMPLOYER_RATE`, `ALLOWANCE_EXEMPT_CAP`, `CORPORATE_TAX_RATE`. Keep `MAX_CALCULATION_AMOUNT`, VAT-fine and delay-fine code.
- Extend `calc` i18n (ar+en): sector labels, الأجر الأساسي/المتغير/المدخر/استقطاعات, دمغة, month names, insurance-below-minimum error messages (same wording as ASMA), income year-range labels, خصم (discount) row label.

### 3. `src/components/site/tools.tsx`
- **Payroll tab**: add sector segmented control + year 2008–2026 + الأجر الأساسي/المتغير (≤2019)/المدخر (≥2020)/استقطاعات fields; keep monthly/annual toggle (÷12 exactly like ASMA) and insurance switch. Results: net monthly + tax/insurance/damgha monthly & annual, 12-month detail table (shows mid-year law changes, e.g. 2024), bracket table per law period incl. خصم row, insurance table with validity + Arabic error message when wage is below the subscription minimum.
- **Income tab**: year list exactly ASMA's (2026 … 2005 with range labels); results + bracket table with discount row for 2017/2018; company mode uses the company bracket set (flat/banded per year).

### 4. Verification
- `npx tsc --noEmit` + `npm run build`; skim `node_modules/next/dist/docs/` per AGENTS.md (no Next APIs touched, client component only).
- Compile the engine standalone with tsc and run a node spot-check script against hand-computed ASMA values, e.g.: income 50,000 @2026 → tax 1,000; income 1,300,000 @2024 → 327,500 (27.5% tier); income 100,000 @2018 → netTax 14,291.25 (7.5% discount); salary 2026 private 10,000/month → employee insurance 1,100, monthly tax 592.50, net 8,307.50; 2024 salary showing Jan–Feb on law 175/2023 vs Mar–Dec on law 7/2024; company 2M @2014 → 550,000; damgha 10,000 public → 79.60; 2019 insurance split 14%+11%.
