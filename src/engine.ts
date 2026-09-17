import type { Borrower, Month } from "./data";
export interface Forecast {
  month: string;
  income: number;
  conservative: number;
  essentials: number;
  obligations: number;
  capacity: number;
}
export interface Analysis {
  forecast: Forecast[];
  recentRatio: number;
  signal: "Seasonal pattern" | "Stable cash flow" | "Sustained decline";
  evidence: string[];
  seasonalStrength: number;
  confidence: string;
}
export interface Plan {
  name: string;
  payments: number[];
  total: number;
  unmet: number;
  stress: number;
  minCash: number;
  shortfall: number;
  feasible: boolean;
}
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
const average = (xs: number[]) => sum(xs) / xs.length;
export function validateHistory(rows: Month[]): void {
  if (rows.length < 12 || rows.length > 60)
    throw new Error("Import 12–60 consecutive monthly records.");
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month) || seen.has(r.month))
      throw new Error("Each month must be unique and use YYYY-MM.");
    seen.add(r.month);
    for (const key of ["income", "essentials", "obligations"] as const)
      if (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 10000000)
        throw new Error("Amounts must be numbers between 0 and 10,000,000.");
    if (i > 0) {
      const last = new Date(rows[i - 1].month + "-01T00:00:00Z");
      last.setUTCMonth(last.getUTCMonth() + 1);
      if (last.toISOString().slice(0, 7) !== r.month)
        throw new Error("Months must be consecutive and sorted oldest first.");
    }
  });
}
export function analyze(b: Borrower, buffer: number, shock: number): Analysis {
  validateHistory(b.history);
  if (!Number.isFinite(buffer) || buffer < 0 || !Number.isInteger(buffer))
    throw new Error(
      "The safety buffer must be a non-negative whole-rupee amount.",
    );
  if (!Number.isFinite(shock) || shock < 0 || shock > 100)
    throw new Error("Income shock must be between 0 and 100 percent.");
  if (
    !Number.isSafeInteger(b.principal) ||
    !Number.isSafeInteger(b.interest) ||
    b.principal < 0 ||
    b.interest < 0
  )
    throw new Error("Loan amounts must be non-negative whole rupees.");
  const h = b.history,
    last = new Date(h.at(-1)!.month + "-01T00:00:00Z");
  const paired = h.slice(-3).map((r, i) => {
    const old = h[h.length - 15 + i];
    return old ? r.income / Math.max(1, old.income) : 1;
  });
  const ratio = average(paired),
    deterioration = h.length >= 15 && paired.every((r) => r < 0.85);
  const trailing = average(h.slice(-12).map((r) => r.income));
  const strength =
    (Math.max(...h.slice(-12).map((r) => r.income)) -
      Math.min(...h.slice(-12).map((r) => r.income))) /
    Math.max(1, trailing);
  const signal = deterioration
    ? "Sustained decline"
    : strength > 0.6
      ? "Seasonal pattern"
      : "Stable cash flow";
  const forecast = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(last);
    d.setUTCMonth(d.getUTCMonth() + i + 1);
    const same = h.filter(
      (r) => Number(r.month.slice(5)) === d.getUTCMonth() + 1,
    );
    const base = average(same.map((r) => r.income));
    const trend = deterioration ? Math.min(1, ratio) : 1;
    const income = Math.round(base * trend * (1 - shock / 100));
    // The lower bound is a transparent 15% scenario haircut, not a calibrated probability interval.
    const conservative = Math.round(income * 0.85);
    const essentials = Math.round(
      average(h.slice(-3).map((r) => r.essentials)),
    );
    const obligations = Math.round(
      average(h.slice(-3).map((r) => r.obligations)),
    );
    return {
      month: d.toISOString().slice(0, 7),
      income,
      conservative,
      essentials,
      obligations,
      capacity: Math.max(0, conservative - essentials - obligations - buffer),
    };
  });
  return {
    forecast,
    recentRatio: ratio,
    signal,
    seasonalStrength: strength,
    confidence:
      h.length >= 24
        ? `${h.length}-month evidence`
        : "Limited seasonal evidence",
    evidence: [
      h.length < 15
        ? "Fewer than 15 months are available: a full three-month year-on-year comparison is not possible."
        : `Latest three months average ${Math.abs(Math.round((ratio - 1) * 100))}% ${ratio >= 1 ? "above" : "below"} their year-earlier counterparts.`,
      deterioration
        ? "Each of the last three matched months fell over 15%; the forecast carries this decline forward."
        : `Future income uses matching calendar months from ${h.length} months of history.`,
      `Capacity protects essential expenses, existing debts and a ${money(buffer)} monthly safety buffer.`,
      `A 15% conservative income haircut${shock ? ` plus your ${shock}% shock scenario` : ""} is applied before scheduling.`,
    ],
  };
}
function evaluate(
  name: string,
  payments: number[],
  forecast: Forecast[],
  buffer: number,
  totalDue: number,
): Plan {
  const balances = forecast.map(
    (f, i) => f.conservative - f.essentials - f.obligations - payments[i],
  );
  const deficits = balances.map((x) => Math.max(0, buffer - x));
  const total = sum(payments),
    unmet = totalDue - total;
  return {
    name,
    payments,
    total,
    unmet,
    stress: deficits.filter((x) => x > 0).length,
    minCash: Math.min(...balances),
    shortfall: sum(deficits),
    feasible: unmet === 0 && deficits.every((x) => x === 0),
  };
}
export function buildPlans(b: Borrower, a: Analysis, buffer: number): Plan[] {
  const total = b.principal + b.interest,
    n = a.forecast.length;
  const fixed = Array.from(
    { length: n },
    (_, i) => Math.floor(total / n) + (i < total % n ? 1 : 0),
  );
  const capacity = a.forecast.map((f) => f.capacity),
    pool = sum(capacity),
    target = Math.min(total, pool);
  const flexible = capacity.map((c) =>
    pool ? Math.floor((target * c) / pool) : 0,
  );
  let remainder = target - sum(flexible);
  for (let i = 0; remainder > 0; i = (i + 1) % n) {
    if (flexible[i] < capacity[i]) {
      flexible[i]++;
      remainder--;
    }
  }
  return [
    evaluate("Fixed schedule", fixed, a.forecast, buffer, total),
    evaluate("Cash-flow aligned", flexible, a.forecast, buffer, total),
  ];
}
export function explain(b: Borrower, a: Analysis, plans: Plan[]): string {
  const [fixed, aligned] = plans;
  if (!aligned.feasible)
    return aligned.unmet > 0
      ? `${b.name.split(" ")[0]}'s conservative six-month capacity leaves ${money(aligned.unmet)} unscheduled. Extending the term or using a reserve needs a separate review. Do not describe this as an affordable full-repayment plan.`
      : `The obligation can be scheduled, but ${aligned.stress} months still fall below the protected buffer, even with capacity-limited payments. A living-cost shortfall needs review before approval.`;
  const lean = a.forecast
    .filter((f) => f.capacity < (b.principal + b.interest) / 6)
    .map((f) =>
      new Date(f.month + "-01").toLocaleString("en", { month: "short" }),
    );
  return `Move repayment away from ${lean.join(" and ") || "lower-capacity months"} and toward stronger income periods. The same ${money(aligned.total)} is scheduled within six months, with ${fixed.stress - aligned.stress} fewer buffer-breach months. ${a.signal === "Sustained decline" ? "A sustained decline still warrants a borrower check-in." : b.history.length < 15 ? "More history is needed to assess year-on-year deterioration." : "Recent earnings do not show a sustained year-on-year decline."}`;
}
