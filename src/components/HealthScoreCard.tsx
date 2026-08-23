"use client";

import Link from "next/link";
import { HeartPulse, ChevronRight, Lightbulb } from "lucide-react";
import { computeHealthScore, type HealthScoreInput } from "@/lib/healthScore";

const TIER_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  "needs-work": "Needs Work",
};

function tierClasses(tier: string) {
  if (tier === "excellent" || tier === "good") {
    return { text: "text-accent-green", stroke: "#4A8C6F" };
  }
  if (tier === "fair") return { text: "text-amber-600 dark:text-amber-400", stroke: "#D4A04A" };
  return { text: "text-accent-red", stroke: "#E87070" };
}

export default function HealthScoreCard({ input }: { input: HealthScoreInput }) {
  const { score, tier, tips } = computeHealthScore(input);
  const cls = tierClasses(tier);

  return (
    <div className="paper-card p-6 mb-8 relative rotate-[0.5deg] card-hover">
      <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.04)] pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse size={20} className="text-accent-warm" />
          <h2 className="font-handwritten text-2xl sm:text-3xl text-ink-dark">Financial Health</h2>
        </div>
        <Link href="/insights" className="text-xs text-accent-warm hover:underline font-bold flex items-center">
          Insights <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
        <div className="shrink-0 mx-auto sm:mx-0" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Financial health score: ${score} of 100`}>
          <svg viewBox="0 0 120 68" className="w-36 h-auto" aria-hidden="true">
            <path
              d="M8 60 A52 52 0 0 1 112 60"
              fill="none"
              stroke="var(--paper-dark, #eee)"
              strokeWidth={10}
              strokeLinecap="round"
            />
            <path
              d="M8 60 A52 52 0 0 1 112 60"
              fill="none"
              stroke={cls.stroke}
              strokeWidth={10}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${score} 100`}
              style={{ transition: "stroke-dasharray 0.7s ease, stroke 0.3s ease" }}
            />
            <text x="60" y="50" textAnchor="middle" className="fill-current text-[26px] font-handwritten" >
              <tspan className={cls.text}>{score}</tspan>
            </text>
            <text x="60" y="63" textAnchor="middle" className="fill-current text-ink-light" style={{ fontSize: 8, letterSpacing: 1 }}>
              OUT OF 100
            </text>
          </svg>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] uppercase tracking-wider font-bold text-ink-light mb-1">Status</p>
          <p className={`font-handwritten text-2xl font-semibold ${cls.text} mb-3`}>{TIER_LABEL[tier]}</p>
          {tips.length > 0 && (
            <ul className="space-y-1.5">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-1.5 text-xs text-ink-medium leading-snug">
                  <Lightbulb size={13} className="text-accent-warm shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
