'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import CallVolumeChart from '@/components/charts/CallVolumeChart';
import TokenBreakdownChart from '@/components/charts/TokenBreakdownChart';
import CostChart from '@/components/charts/CostChart';

interface ModelStats {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface UserStats {
  userId: string;
  calls: number;
  costUsd: number;
}

interface UsageData {
  month: string;
  budgetUsd: number;
  totalCostUsd: number;
  gpt: ModelStats;
  gemini: ModelStats;
  perUser: UserStats[];
}

function formatUsd(n: number) {
  return n < 0.01 ? '<$0.01' : `$${n.toFixed(2)}`;
}

function formatTokens(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
}

function gaugeColor(pct: number) {
  if (pct >= 90) return 'bg-red-700';
  if (pct >= 75) return 'bg-red-500';
  if (pct >= 50) return 'bg-orange-400';
  if (pct >= 25) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

function CostGauge({ totalCostUsd, budgetUsd }: { totalCostUsd: number; budgetUsd: number }) {
  const pct = budgetUsd > 0 ? Math.min((totalCostUsd / budgetUsd) * 100, 100) : 0;
  const overBudget = totalCostUsd > budgetUsd && budgetUsd > 0;
  const color = gaugeColor(pct);

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-text-darker">Monthly Cost</h2>
        <span className="text-xs text-text-dark">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-5xl font-bold ${overBudget ? 'text-red-600' : 'text-text-darker'}`}>
          {formatUsd(totalCostUsd)}
        </span>
        {budgetUsd > 0 && (
          <span className="text-xl text-text-dark">/ {formatUsd(budgetUsd)}</span>
        )}
      </div>

      {budgetUsd > 0 && (
        <>
          <div className="relative mt-6 h-5 w-full overflow-hidden rounded-full bg-secondary/40">
            {/* Filled bar */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${color} ${overBudget ? 'animate-pulse' : ''}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
            {/* Threshold markers */}
            {[25, 50, 75, 90].map((threshold) => (
              <div
                key={threshold}
                className="absolute top-0 h-full w-px bg-white/70"
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>

          {/* Threshold labels */}
          <div className="relative mt-1 h-4 w-full text-[10px] text-text-dark">
            {[25, 50, 75, 90].map((threshold) => (
              <span
                key={threshold}
                className="absolute -translate-x-1/2"
                style={{ left: `${threshold}%` }}
              >
                {threshold}%
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm font-medium text-text-dark">
            {pct.toFixed(1)}% of budget used
            {overBudget && <span className="ml-2 text-red-600 font-semibold">— over budget!</span>}
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-secondary/60 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-dark">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-darker">{value}</p>
      {sub && <p className="mt-1 text-xs text-text-dark">{sub}</p>}
    </div>
  );
}

export default function AdminUsagePage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    api.getUsage()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load usage'))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || (user && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-text-dark">{error === 'Not authorized' ? 'Not authorized.' : error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalCalls = data.gpt.calls + data.gemini.calls;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-darker md:text-3xl">Usage Dashboard</h1>
        <p className="mt-1 text-text-dark text-sm">LLM usage and cost for {data.month}</p>
      </div>

      {/* Cost gauge — hero */}
      <CostGauge totalCostUsd={data.totalCostUsd} budgetUsd={data.budgetUsd} />

      {/* Call volume */}
      <div>
        <h2 className="text-base font-semibold text-text-darker mb-3">Call Volume</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="GPT Descriptions" value={String(data.gpt.calls)} sub="gpt-4o-mini" />
          <StatCard label="Gemini Images" value={String(data.gemini.calls)} sub="gemini-2.5-flash" />
          <StatCard label="Total API Calls" value={String(totalCalls)} />
        </div>
      </div>

      {/* Token + cost breakdown */}
      <div>
        <h2 className="text-base font-semibold text-text-darker mb-3">Token Breakdown</h2>
        <div className="overflow-hidden rounded-xl border border-secondary/60 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-secondary/60 bg-secondary/20">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-darker">Model</th>
                <th className="px-4 py-3 text-right font-medium text-text-darker">Input</th>
                <th className="px-4 py-3 text-right font-medium text-text-darker">Output</th>
                <th className="px-4 py-3 text-right font-medium text-text-darker">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/40">
              {[
                { label: 'GPT-4o-mini', stats: data.gpt },
                { label: 'Gemini 2.5 Flash', stats: data.gemini },
              ].map(({ label, stats }) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-text-darker">{label}</td>
                  <td className="px-4 py-3 text-right text-text-dark">{formatTokens(stats.inputTokens)}</td>
                  <td className="px-4 py-3 text-right text-text-dark">{formatTokens(stats.outputTokens)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text-darker">{formatUsd(stats.costUsd)}</td>
                </tr>
              ))}
              <tr className="bg-secondary/10">
                <td className="px-4 py-3 font-bold text-text-darker">Total</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatTokens(data.gpt.inputTokens + data.gemini.inputTokens)}</td>
                <td className="px-4 py-3 text-right text-text-dark">{formatTokens(data.gpt.outputTokens + data.gemini.outputTokens)}</td>
                <td className="px-4 py-3 text-right font-bold text-text-darker">{formatUsd(data.totalCostUsd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-text-dark">
          * Gemini cost is an approximation — image generation may be priced per image, not per token.
        </p>
      </div>

      {/* Per-user breakdown */}
      <div>
        <h2 className="text-base font-semibold text-text-darker mb-1">Per-User Activity</h2>
        <p className="text-xs text-text-dark mb-3">userId attribution available from deploy date onward.</p>
        {data.perUser.length === 0 ? (
          <p className="text-sm text-text-dark">No per-user data yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-secondary/60 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-secondary/60 bg-secondary/20">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-darker">User ID</th>
                  <th className="px-4 py-3 text-right font-medium text-text-darker">Calls</th>
                  <th className="px-4 py-3 text-right font-medium text-text-darker">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/40">
                {data.perUser.map((u) => (
                  <tr key={u.userId}>
                    <td className="px-4 py-3 font-mono text-xs text-text-darker">{u.userId}</td>
                    <td className="px-4 py-3 text-right text-text-dark">{u.calls}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-darker">{formatUsd(u.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trends */}
      <div>
        <h2 className="text-base font-semibold text-text-darker mb-1">Trends</h2>
        <p className="text-xs text-text-dark mb-5">Each chart has its own time range — select a preset or enter a custom range.</p>
        <div className="space-y-6">
          <CallVolumeChart />
          <TokenBreakdownChart />
          <CostChart />
        </div>
      </div>
    </div>
  );
}
