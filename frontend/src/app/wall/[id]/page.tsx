'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import PieceGallery from '@/components/PieceGallery';

interface GenerationData {
  id: string;
  style: string;
  preferences: {
    style: string;
    colorScheme: string[];
    frameMaterial: string;
    roomType: string;
    wallDimensions?: { width: number; height: number };
  };
  wallRenderUrl: string;
  pieces: {
    title: string;
    imageUrl: string;
    description?: string;
    medium?: string;
    dimensions?: string;
    placement?: string;
  }[];
  createdAt: string;
}

export default function WallViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<GenerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const result = await api.getGeneration(id);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generation');
      } finally {
        setLoading(false);
      }
    }
    fetchGeneration();
  }, [id]);

  const handleRetry = () => {
    const prefs = data!.preferences;
    const params = new URLSearchParams({
      style: prefs.style,
      colors: prefs.colorScheme.join(','),
      frame: prefs.frameMaterial,
      room: prefs.roomType,
      ...(prefs.wallDimensions ? { w: String(prefs.wallDimensions.width), h: String(prefs.wallDimensions.height) } : {}),
      ...(feedback ? { feedback } : {}),
    });
    router.push(`/generate?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-text-dark">{error || 'Generation not found'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text-darker md:text-3xl">
        Your Wall — {data.style}
      </h1>

      {/* Wall Render */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-secondary/60">
        <img
          src={data.wallRenderUrl}
          alt={`${data.style} wall render`}
          className="w-full object-cover"
        />
      </div>

      {/* Individual Pieces */}
      <h2 className="mt-10 mb-6 text-xl font-bold text-text-darker">
        Individual Pieces
      </h2>
      <PieceGallery pieces={data.pieces} />

      {/* Retry */}
      <div className="mt-10 text-center">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="cursor-pointer rounded-xl bg-secondary/60 px-6 py-3 text-sm font-medium text-text-darker hover:bg-secondary transition-colors"
          >
            Retry with Changes
          </button>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-secondary/60 bg-white p-6">
            <p className="text-sm font-medium text-text-darker">What would you change?</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., More vibrant colors, larger centerpiece..."
              rows={2}
              className="mt-2 w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker placeholder:text-text-dark/50 focus:border-primary focus:outline-none resize-none"
            />
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={() => setShowFeedback(false)}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
