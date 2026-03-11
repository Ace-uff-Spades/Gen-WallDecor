'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import DateRangeSelector, { DateRange, getDefaultRange } from '@/components/DateRangeSelector';

interface DayBucket {
  date: string;
  gptCalls: number;
  geminiCalls: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CallVolumeChart() {
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
        <h2 className="text-base font-semibold text-text-darker">Call Volume</h2>
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
          <BarChart data={chartData} barSize={chartData.length > 14 ? 8 : 16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="gptCalls" name="GPT-4o-mini" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0] as [number, number, number, number]} />
            <Bar dataKey="geminiCalls" name="Gemini" stackId="a" fill="#10b981" radius={[3, 3, 0, 0] as [number, number, number, number]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
