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
  wallRenderVersions?: string[];
  pieces: {
    title: string;
    imageUrl: string;
    description?: string;
    medium?: string;
    dimensions?: string;
    placement?: string;
    type?: 'poster' | 'object';
    position?: { x: number; y: number };
    links?: {
      frameUrl: string | null;
      printUrl: string | null;
      objectUrl: string | null;
      mountingUrls: { name: string; url: string }[];
    };
  }[];
  pieceVersions?: string[][];
  finalizedAt?: string;
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
  const [openDotIndex, setOpenDotIndex] = useState<number | null>(null);
  const [selectedPieces, setSelectedPieces] = useState<Set<number>>(new Set());
  const [currentVersionIndexes, setCurrentVersionIndexes] = useState<number[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingWallRender, setIsUpdatingWallRender] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [pieceRegenerationCount, setPieceRegenerationCount] = useState(0);

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const result = await api.getGeneration(id);
        setData(result);
        setCurrentVersionIndexes(
          result.pieces.map((_: any, i: number) => {
            const versions = result.pieceVersions?.[i];
            return versions ? versions.length - 1 : 0;
          })
        );
        if (result.finalizedAt) setIsFinalized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generation');
      } finally {
        setLoading(false);
      }
    }
    fetchGeneration();
  }, [id]);

  useEffect(() => {
    function handleClick() {
      if (openDotIndex !== null) setOpenDotIndex(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openDotIndex]);

  function togglePieceSelection(index: number) {
    setSelectedPieces(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function navigateVersion(pieceIndex: number, delta: number) {
    setCurrentVersionIndexes(prev => {
      const next = [...prev];
      const versions = data?.pieceVersions?.[pieceIndex];
      if (!versions) return next;
      next[pieceIndex] = Math.max(0, Math.min(versions.length - 1, next[pieceIndex] + delta));
      return next;
    });
  }

  async function handleRegenerateSelected() {
    if (selectedPieces.size === 0 || !data) return;
    setIsRegenerating(true);
    try {
      const pieces = Array.from(selectedPieces).map(i => ({
        pieceIndex: i,
        description: data.pieces[i].description ?? '',
      }));
      const result = await api.regeneratePieces(id, pieces);
      setData(prev => prev ? { ...prev, pieceVersions: result.pieceVersions } : prev);
      setPieceRegenerationCount(result.pieceRegenerationCount);
      setCurrentVersionIndexes(prev => {
        const next = [...prev];
        for (const i of selectedPieces) {
          next[i] = result.pieceVersions[i].length - 1;
        }
        return next;
      });
      setSelectedPieces(new Set());
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleUpdateWallRender() {
    if (!data) return;
    setIsUpdatingWallRender(true);
    try {
      const pieceImageRefs = (data.pieceVersions ?? []).map(
        (versions: string[], i: number) => versions[currentVersionIndexes[i]] ?? versions[versions.length - 1]
      );
      const result = await api.regenerateWallRender(id, pieceImageRefs);
      setData(prev => prev ? { ...prev, wallRenderVersions: result.wallRenderVersions } : prev);
    } catch (err) {
      console.error('Wall render update failed:', err);
    } finally {
      setIsUpdatingWallRender(false);
    }
  }

  async function handleFinalize() {
    if (!data) return;
    try {
      await api.finalizeGeneration(id);
      setIsFinalized(true);
    } catch (err) {
      console.error('Finalize failed:', err);
    }
  }

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
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-secondary border-t-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-text-light/60 text-sm">{error || 'Generation not found'}</p>
      </div>
    );
  }

  const wallRenderSrc =
    data.wallRenderVersions && data.wallRenderVersions.length > 0
      ? data.wallRenderVersions[data.wallRenderVersions.length - 1]
      : data.wallRenderUrl;

  return (
    <div className="min-h-screen bg-dark pb-16">
      {/* Zone 1: Hero wall render */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Title */}
        <p className="font-mono text-[11px] tracking-widest uppercase text-text-light/40 mb-2">
          Your Wall
        </p>
        <h1 className="text-2xl font-bold text-text-light mb-6">{data.style}</h1>

        {/* Wall render */}
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={wallRenderSrc}
            alt={`${data.style} wall render`}
            className="w-full object-cover max-h-[520px]"
          />

          {/* Interactive piece dots */}
          {data.pieces.map((piece, i) => {
            if (!piece.position) return null;
            const isOpen = openDotIndex === i;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${piece.position.x}%`,
                  top: `${piece.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDotIndex(isOpen ? null : i); }}
                  className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`View links for ${piece.title}`}
                />
                {isOpen && (
                  <div
                    className="absolute z-10 bg-white rounded-xl shadow-lg p-4 w-52 text-sm"
                    style={{ top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <p className="font-semibold text-text mb-3">{piece.title}</p>
                    {piece.type === 'poster' && (
                      <>
                        {piece.links?.frameUrl && (
                          <a href={piece.links.frameUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors mb-1.5 text-sm">
                            Buy a frame
                          </a>
                        )}
                        {piece.links?.printUrl && (
                          <a href={piece.links.printUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors text-sm">
                            Print this poster
                          </a>
                        )}
                      </>
                    )}
                    {piece.type === 'object' && (
                      <>
                        {piece.links?.objectUrl && (
                          <a href={piece.links.objectUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors mb-1.5 text-sm">
                            Buy this piece
                          </a>
                        )}
                        {piece.links?.mountingUrls.map(m => (
                          <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors text-sm">
                            Buy a {m.name}
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls bar */}
        {!isFinalized ? (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handleRegenerateSelected}
              disabled={selectedPieces.size === 0 || isRegenerating}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-text-light hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRegenerating ? 'Regenerating…' : `Regenerate Selected${selectedPieces.size > 0 ? ` (${selectedPieces.size})` : ''}`}
            </button>
            <button
              onClick={handleUpdateWallRender}
              disabled={isUpdatingWallRender}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-text-light hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdatingWallRender ? 'Updating…' : 'Update Wall Render'}
            </button>
            <button
              onClick={handleFinalize}
              className="rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Finalize Wall
            </button>
            {pieceRegenerationCount > 0 && (
              <span className="text-xs text-text-light/40 ml-auto">
                {pieceRegenerationCount} regenerations used
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-green-400">✓ Wall finalized</span>
          </div>
        )}
      </div>

      {/* Zone 2: Pieces strip + detail panel */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-text-light/40 mb-4">
          Individual Pieces
        </p>
        <PieceGallery
          pieces={data.pieces}
          generationId={id}
          selectedPieces={selectedPieces}
          onToggleSelect={isFinalized ? undefined : togglePieceSelection}
          currentVersionIndexes={currentVersionIndexes}
          pieceVersions={data.pieceVersions}
          onNavigateVersion={navigateVersion}
        />
      </div>

      {/* Retry section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 text-center">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-xl border border-white/20 px-6 py-2.5 text-sm font-medium text-text-light/60 hover:text-text-light hover:border-white/40 transition-colors cursor-pointer"
          >
            Not happy? Start over with changes
          </button>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl bg-dark-secondary p-6 text-left">
            <p className="text-sm font-medium text-text-light mb-3">What would you change?</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., More vibrant colors, larger centerpiece…"
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-text-light placeholder:text-text-light/30 focus:border-primary focus:outline-none resize-none"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => setShowFeedback(false)}
                className="rounded-lg px-4 py-2 text-sm text-text-light/50 hover:text-text-light transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="rounded-xl bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
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
