'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import DescriptionCard, { PieceDescription } from '@/components/DescriptionCard';

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();

  const [descriptions, setDescriptions] = useState<PieceDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const preferences = {
    style: searchParams.get('style') || '',
    colorScheme: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    frameMaterial: searchParams.get('frame') || '',
    roomType: searchParams.get('room') || '',
    ...(searchParams.get('w') && searchParams.get('h')
      ? { wallDimensions: { width: Number(searchParams.get('w')), height: Number(searchParams.get('h')) } }
      : {}),
  };

  const fetchDescriptions = useCallback(async (feedbackText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateDescriptions(preferences, feedbackText);
      setDescriptions(result.descriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate descriptions');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    if (!user) return;
    const initialFeedback = searchParams.get('feedback') || undefined;
    fetchDescriptions(initialFeedback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDescriptions, user]);

  const handleRegenerate = async () => {
    await fetchDescriptions(feedback);
    setFeedback('');
  };

  const handleUpdateDescription = (index: number, updated: PieceDescription) => {
    setDescriptions((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  const handleGenerateImages = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateImages(preferences, descriptions);
      router.push(`/wall/${result.generationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
      setGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <h2 className="text-xl font-bold text-text-darker">Almost there</h2>
          <p className="mt-2 text-text-dark">Sign in to generate your wall decor.</p>
          <button
            onClick={signIn}
            className="mt-6 cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
          <p className="mt-4 text-text-dark">Generating descriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text-darker md:text-3xl">
        Review Your Descriptions
      </h1>
      <p className="mt-2 text-text-dark">
        Edit any description before generating images. Style: <span className="font-medium">{preferences.style}</span>
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {descriptions.map((desc, i) => (
          <DescriptionCard
            key={i}
            piece={desc}
            index={i}
            onUpdate={(updated) => handleUpdateDescription(i, updated)}
          />
        ))}
      </div>

      {/* Regenerate with feedback */}
      <div className="mt-8 rounded-2xl border border-secondary/60 bg-white p-6">
        <p className="text-sm font-medium text-text-darker">Want different descriptions?</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., Make them more colorful, add abstract pieces..."
          rows={2}
          className="mt-2 w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker placeholder:text-text-dark/50 focus:border-primary focus:outline-none resize-none"
        />
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="mt-3 cursor-pointer rounded-lg bg-secondary/60 px-5 py-2 text-sm font-medium text-text-darker hover:bg-secondary transition-colors disabled:opacity-40"
        >
          Regenerate All
        </button>
      </div>

      {/* Generate Images CTA */}
      <div className="mt-8 text-center">
        <button
          onClick={handleGenerateImages}
          disabled={generating || descriptions.length === 0}
          className="cursor-pointer rounded-2xl bg-primary px-10 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating Images...' : 'Generate Images'}
        </button>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
