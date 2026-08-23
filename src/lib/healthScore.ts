export interface HealthScoreInput {
  /** % of the monthly budget consumed (null when no budget is set). */
  budgetUsagePct: number | null;
  /** Spending change vs the previous month, negative means less spent (null without history). */
  momChangePct: number | null;
  /** Share of recurring bills currently not overdue, 0–100 (null when no bills tracked). */
  billsOnTimePct: number | null;
  /** Savings rate for the month, can be negative (null when no income logged). */
  savingsRatePct: number | null;
  /** Biggest category increase vs the previous month, used for actionable tips. */
  topCategorySpike?: { name: string; increasePct: number } | null;
}

export interface ScoreComponent {
  earned: number;
  max: number;
}

export type HealthTier = "excellent" | "good" | "fair" | "needs-work";

export interface HealthScoreResult {
  score: number;
  tier: HealthTier;
  tips: string[];
  components: {
    budget: ScoreComponent | null;
    savings: ScoreComponent | null;
    trend: ScoreComponent | null;
    bills: ScoreComponent | null;
  };
}

const WEIGHTS = { budget: 30, savings: 25, trend: 20, bills: 25 };

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** ≤75% used is perfect; degrades linearly to half credit at 100%; zero past 150%. */
function budgetEarned(usage: number): number {
  if (usage <= 75) return WEIGHTS.budget;
  if (usage <= 100) return lerp(WEIGHTS.budget, WEIGHTS.budget / 2, (usage - 75) / 25);
  return lerp(WEIGHTS.budget / 2, 0, (usage - 100) / 50);
}

/** Flat/down spend earns full marks; erodes to zero once spending grows 40%+. */
function trendEarned(changePct: number): number {
  if (changePct <= -5) return WEIGHTS.trend;
  if (changePct <= 10) return lerp(WEIGHTS.trend, WEIGHTS.trend / 2, (changePct + 5) / 15);
  return lerp(WEIGHTS.trend / 2, 0, (changePct - 10) / 30);
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  let earnedSum = 0;
  let maxSum = 0;

  const budget =
    input.budgetUsagePct == null
      ? null
      : { earned: budgetEarned(input.budgetUsagePct), max: WEIGHTS.budget };
  const savings =
    input.savingsRatePct == null
      ? null
      : { earned: (clamp(input.savingsRatePct, 0, 100) / 100) * WEIGHTS.savings, max: WEIGHTS.savings };
  const trend =
    input.momChangePct == null ? null : { earned: trendEarned(input.momChangePct), max: WEIGHTS.trend };
  const bills =
    input.billsOnTimePct == null
      ? null
      : { earned: (clamp(input.billsOnTimePct, 0, 100) / 100) * WEIGHTS.bills, max: WEIGHTS.bills };

  for (const c of [budget, savings, trend, bills]) {
    if (c) {
      earnedSum += c.earned;
      maxSum += c.max;
    }
  }

  const score = maxSum > 0 ? Math.round((earnedSum / maxSum) * 100) : 0;
  const tier: HealthTier =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "needs-work";

  const tips: string[] = [];
  const u = input.budgetUsagePct;
  if (u == null) {
    tips.push("Set a monthly budget in Settings — it carries the most weight in your score.");
  } else if (u > 100) {
    tips.push("You're over budget this month. Pause non-essential spending to recover.");
  } else if (u >= 80) {
    tips.push(`You've used ${Math.round(u)}% of your monthly budget — pace what's left carefully.`);
  }
  if (input.topCategorySpike && input.topCategorySpike.increasePct >= 10) {
    tips.push(
      `Try reducing ${input.topCategorySpike.name} spending by 10% next month — it grew ${Math.round(
        input.topCategorySpike.increasePct
      )}% recently.`
    );
  }
  if (input.momChangePct != null && input.momChangePct > 10) {
    tips.push(`Spending is up ${Math.round(input.momChangePct)}% vs last month — find the biggest jump.`);
  }
  if (input.savingsRatePct != null && input.savingsRatePct < 10) {
    tips.push("Aim to save at least 10% of your income — even small amounts compound.");
  }
  if (input.billsOnTimePct != null && input.billsOnTimePct < 100) {
    tips.push("Clear overdue bills to protect your punctuality points.");
  }

  return { score, tier, tips: tips.slice(0, 3), components: { budget, savings, trend, bills } };
}
