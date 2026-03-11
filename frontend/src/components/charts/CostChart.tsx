'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import DateRangeSelector, { DateRange, getDefaultRange } from '@/components/DateRangeSelector';

interface DayBucket {
  date: string;
  costUsd: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatUsd(n: number) {
  if (n === 0) return '$0';
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(3)}`;
}

export default function CostChart() {
  const [range, setRange] = useState<DateRange>(() => getDefaultRange('7d'));
  const [data, setData] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getUsageTimeseries(range.from, range.to)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const chartData = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-text-darker">Cost Over Time</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        </div>
      ) : error ? (
        <p className="h-48 flex items-center justify-center text-sm text-text-dark">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(v) => (v === 0 ? '$0' : `$${v.toFixed(2)}`)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip formatter={(v) => [typeof v === 'number' ? formatUsd(v) : v, 'Cost']} />
            <Area
              type="monotone"
              dataKey="costUsd"
              name="Cost"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
