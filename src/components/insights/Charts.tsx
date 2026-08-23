"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TooltipEntryPayload {
  name?: string;
  icon?: string;
  day?: number;
  label?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; color?: string; name?: string; payload: TooltipEntryPayload }>;
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const first = payload[0].payload;
    const title =
      first.name ? `${first.icon ?? ""} ${first.name}`.trim()
      : first.day != null ? `Day ${first.day}`
      : first.label ?? (label != null ? String(label) : "");
    const multi = payload.length > 1;
    return (
      <div className="paper-card px-3 py-2 text-xs border border-accent-warm/30 shadow-md">
        {title && <p className="font-semibold text-ink-dark">{title}</p>}
        {payload.map((entry, i) => (
          <p
            key={`${entry.name ?? i}-${i}`}
            className={`amount font-bold mt-0.5 ${!multi ? "text-accent-warm" : ""}`}
            style={multi && entry.color ? { color: entry.color } : undefined}
          >
            {multi && entry.name ? `${entry.name}: ` : ""}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export interface CategoryDatum {
  name: string;
  icon: string;
  value: number;
  color: string;
}

export function CategoryPie({ data, onSelect }: { data: CategoryDatum[]; onSelect?: (name: string) => void }) {
  return (
    <div className={`w-44 h-44 shrink-0 ${onSelect ? "cursor-pointer" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
            onClick={onSelect ? (_data: unknown, index: number) => onSelect(data[index].name) : undefined}
            isAnimationActive
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DailyTrendDatum {
  day?: number;
  label?: string;
  amount: number;
}

export function DailyTrendArea({ data }: { data: DailyTrendDatum[] }) {
  const xKey = data.some((d) => d.label != null) ? "label" : "day";
  return (
    <div className="h-48 pr-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4854A" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#D4854A" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: "#888" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: "#888" }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="amount" stroke="#D4854A" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface MonthlyComparisonDatum {
  month: string;
  /** "YYYY-MM" key used for deep-linking on tap. */
  key?: string;
  expenses: number;
  income: number;
}

export function MonthlyComparisonBar({
  data,
  onSelectMonth,
}: {
  data: MonthlyComparisonDatum[];
  onSelectMonth?: (key: string) => void;
}) {
  return (
    <div className={`h-48 pr-4 ${onSelectMonth ? "cursor-pointer" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#888" }} />
          <YAxis tick={{ fontSize: 9, fill: "#888" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="income" name="Income" fill="#4A8C6F" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#E87070"
            radius={[4, 4, 0, 0]}
            barSize={20}
            isAnimationActive
            onClick={
              onSelectMonth
                ? (_data: unknown, index: number) => {
                    const d = data[index];
                    if (d?.key) onSelectMonth(d.key);
                  }
                : undefined
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
