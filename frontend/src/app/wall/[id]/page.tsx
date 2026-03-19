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
        if (result.finalizedAt) {
          setIsFinalized(true);
        }
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

  // Use the latest wall render version if available, otherwise fall back to wallRenderUrl
  const wallRenderSrc =
    data.wallRenderVersions && data.wallRenderVersions.length > 0
      ? data.wallRenderVersions[data.wallRenderVersions.length - 1]
      : data.wallRenderUrl;

  return (
    <div className="py-10">
      {/* Constrained: heading + wall render */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-text-darker md:text-3xl">
          Your Wall — {data.style}
        </h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-secondary/60">
          <div className="relative inline-block w-full">
            <img
              src={wallRenderSrc}
              alt={`${data.style} wall render`}
              className="w-full object-cover"
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
                  {/* Dot */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenDotIndex(isOpen ? null : i); }}
                    className="w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`View links for ${piece.title}`}
                  />

                  {/* Popover */}
                  {isOpen && (
                    <div
                      className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48 text-sm"
                      style={{ top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}
                    >
                      <p className="font-semibold mb-2">{piece.title}</p>
                      {piece.type === 'poster' && (
                        <>
                          {piece.links?.frameUrl && (
                            <a href={piece.links.frameUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline mb-1">
                              Buy a frame
                            </a>
                          )}
                          {piece.links?.printUrl && (
                            <a href={piece.links.printUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">
                              Print this poster
                            </a>
                          )}
                        </>
                      )}
                      {piece.type === 'object' && (
                        <>
                          {piece.links?.objectUrl && (
                            <a href={piece.links.objectUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline mb-1">
                              Buy this piece
                            </a>
                          )}
                          {piece.links?.mountingUrls.map(m => (
                            <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">
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
        </div>

        {/* Regeneration controls */}
        {!isFinalized && (
          <div className="flex flex-wrap gap-3 items-center mt-4 mb-2">
            <button
              onClick={handleRegenerateSelected}
              disabled={selectedPieces.size === 0 || isRegenerating}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isRegenerating ? 'Regenerating\u2026' : `Regenerate Selected (${selectedPieces.size})`}
            </button>
            <button
              onClick={handleUpdateWallRender}
              disabled={isUpdatingWallRender}
              className="px-4 py-2 bg-secondary/80 text-text-darker rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isUpdatingWallRender ? 'Updating\u2026' : 'Update Wall Render'}
            </button>
            <button
              onClick={handleFinalize}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              Finalize Wall
            </button>
            <span className="text-xs text-text-dark">
              {pieceRegenerationCount} regenerations used
            </span>
          </div>
        )}
        {isFinalized && (
          <div className="mt-2 text-sm text-green-700 font-medium">&#10003; Wall finalized</div>
        )}
      </div>

      {/* Full-width: piece gallery */}
      <div className="mt-10 px-4 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-text-darker">
          Individual Pieces
        </h2>
        <PieceGallery
          pieces={data.pieces}
          generationId={id}
          selectedPieces={selectedPieces}
          onToggleSelect={togglePieceSelection}
          currentVersionIndexes={currentVersionIndexes}
          pieceVersions={data.pieceVersions}
          onNavigateVersion={navigateVersion}
        />
      </div>

      {/* Constrained: retry */}
      <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 text-center">
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
