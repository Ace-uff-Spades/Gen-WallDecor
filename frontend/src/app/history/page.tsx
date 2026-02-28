'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface GenerationSummary {
  id: string;
  style: string;
  wallRenderUrl: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<GenerationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const result = await api.getHistory();
        setGenerations(result.generations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-text-dark">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text-darker md:text-3xl">
        Your Generations
      </h1>
      <p className="mt-2 text-text-dark">Your most recent wall designs</p>

      {generations.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-text-dark">No generations yet</p>
          <Link
            href="/create"
            className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Create Your First Wall
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((gen) => (
            <Link
              key={gen.id}
              href={`/wall/${gen.id}`}
              className="group overflow-hidden rounded-2xl border border-secondary/60 bg-white transition-shadow hover:shadow-md"
            >
              <img
                src={gen.wallRenderUrl}
                alt={`${gen.style} wall`}
                className="aspect-video w-full object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-text-darker group-hover:text-primary transition-colors">
                  {gen.style}
                </h3>
                <p className="mt-1 text-xs text-text-dark">
                  {new Date(gen.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
