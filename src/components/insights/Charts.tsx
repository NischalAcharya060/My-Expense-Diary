"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name?: string; icon?: string; day?: number } }>;
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="paper-card px-3 py-2 text-xs border border-accent-warm/30 shadow-md">
        <p className="font-semibold text-ink-dark">{payload[0].payload.name ? `${payload[0].payload.icon} ${payload[0].payload.name}` : payload[0].payload.day ? `Day ${payload[0].payload.day}` : label}</p>
        <p className="text-accent-warm amount font-bold mt-0.5">{formatCurrency(payload[0].value)}</p>
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

export function CategoryPie({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="w-44 h-44 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
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
  day: number;
  amount: number;
}

export function DailyTrendArea({ data }: { data: DailyTrendDatum[] }) {
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
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#888" }} />
          <YAxis tick={{ fontSize: 9, fill: "#888" }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="amount" stroke="#D4854A" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface MonthlyComparisonDatum {
  month: string;
  expenses: number;
  income: number;
}

export function MonthlyComparisonBar({ data }: { data: MonthlyComparisonDatum[] }) {
  return (
    <div className="h-48 pr-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#888" }} />
          <YAxis tick={{ fontSize: 9, fill: "#888" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="income" name="Income" fill="#4A8C6F" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="expenses" name="Expenses" fill="#E87070" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
