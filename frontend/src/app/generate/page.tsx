'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { getStylePhoto } from '@/lib/stylePhotos';
import WizardSplitLayout from '@/components/WizardSplitLayout';
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
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const preferences = {
    style: searchParams.get('style') || '',
    colorScheme: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    frameMaterial: searchParams.get('frame') || '',
    roomType: searchParams.get('room') || '',
    ...(searchParams.get('w') && searchParams.get('h')
      ? { wallDimensions: { width: Number(searchParams.get('w')), height: Number(searchParams.get('h')) } }
      : {}),
  };

  const photoUrl = getStylePhoto(preferences.style);

  const fetchDescriptions = useCallback(async (feedbackText?: string, previousDescriptions?: PieceDescription[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateDescriptions(preferences, feedbackText, previousDescriptions);
      setDescriptions(result.descriptions);
      setExpandedIndex(0);
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
    await fetchDescriptions(feedback, descriptions);
    setFeedback('');
  };

  const handleUpdateDescription = (index: number, updated: PieceDescription) => {
    setDescriptions((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  async function handleRegeneratePiece(pieceIndex: number) {
    if (!generationId) return;
    setRegeneratingIndex(pieceIndex);
    try {
      await api.regeneratePiece(generationId, pieceIndex, descriptions[pieceIndex].description);
    } catch (err) {
      console.error('Regenerate piece failed:', err);
    } finally {
      setRegeneratingIndex(null);
    }
  }

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

  const toggleExpanded = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  // Left panel content rendered as children of WizardSplitLayout
  const leftContent = (() => {
    if (authLoading) {
      return (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-text-muted">Loading…</span>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="py-8">
          <p className="text-sm text-text-muted mb-4">Sign in to generate your wall decor.</p>
          <button
            onClick={signIn}
            className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-text-muted">Generating descriptions…</span>
        </div>
      );
    }

    return (
      <>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Accordion */}
        <div className="space-y-3">
          {descriptions.map((desc, i) => (
            <DescriptionCard
              key={i}
              piece={desc}
              index={i}
              isExpanded={expandedIndex === i}
              onExpand={() => toggleExpanded(i)}
              onUpdate={(updated) => handleUpdateDescription(i, updated)}
            />
          ))}
        </div>

        {/* Feedback */}
        <div className="mt-6 rounded-xl border border-border bg-bg p-4">
          <p className="text-xs font-medium text-text-muted mb-2">Want something different?</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Make them more colorful, add abstract pieces…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
          />
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="mt-2 cursor-pointer rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:border-text-muted transition-colors disabled:opacity-40"
          >
            Regenerate All
          </button>
        </div>
      </>
    );
  })();

  const canGenerate = !generating && descriptions.length > 0 && !!user && !loading;

  return (
    <WizardSplitLayout
      step={3}
      totalSteps={3}
      title="Here's what we'll make"
      subtitle={preferences.style ? `Style: ${preferences.style}` : undefined}
      photoUrl={photoUrl}
      onNext={canGenerate ? handleGenerateImages : undefined}
      onBack={() => router.back()}
      nextDisabled={!canGenerate}
      nextLabel={generating ? 'Generating…' : 'Generate Images →'}
    >
      {leftContent}
    </WizardSplitLayout>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
