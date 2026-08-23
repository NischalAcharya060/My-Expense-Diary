"use client";

import type { ReactNode } from "react";

interface ProgressRingProps {
  /** Percent complete (clamped 0-100 for display). */
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  children?: ReactNode;
}

export default function ProgressRing({
  pct,
  size = 72,
  stroke = 7,
  color = "var(--accent-green)",
  label,
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(pct, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--paper-dark)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
      {children && (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div className="w-full h-full flex items-center justify-center">{children}</div>
        </foreignObject>
      )}
    </svg>
  );
}
