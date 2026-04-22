'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface PieceLinks {
  frameUrl: string | null;
  printUrl: string | null;
  objectUrl: string | null;
  mountingUrls: { name: string; url: string }[];
}

interface Piece {
  title: string;
  imageUrl: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  placement?: string;
  type?: 'poster' | 'object';
  links?: PieceLinks;
  position?: { x: number; y: number };
}

interface PieceGalleryProps {
  pieces: Piece[];
  generationId: string;
  selectedPieces?: Set<number>;
  onToggleSelect?: (index: number) => void;
  currentVersionIndexes?: number[];
  pieceVersions?: string[][];
  onNavigateVersion?: (pieceIndex: number, delta: number) => void;
}

export default function PieceGallery({
  pieces,
  generationId,
  selectedPieces,
  onToggleSelect,
  currentVersionIndexes,
  pieceVersions,
  onNavigateVersion,
}: PieceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = pieces[activeIndex];

  const handleDownload = async () => {
    try {
      const { url } = await api.getPieceDownloadUrl(generationId, activeIndex);
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${active.title}.png`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  function resolveImageUrl(piece: Piece, i: number): string {
    const versions = pieceVersions?.[i];
    if (!versions || versions.length === 0) return piece.imageUrl;
    const versionIdx = currentVersionIndexes?.[i] ?? versions.length - 1;
    return versions[versionIdx] ?? piece.imageUrl;
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Horizontal scroll strip */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 pb-3" style={{ minWidth: 'max-content' }}>
          {pieces.map((piece, i) => {
            const isChecked = selectedPieces?.has(i) ?? false;
            const versions = pieceVersions?.[i];
            const hasMultipleVersions = versions && versions.length > 1;
            const versionIdx = currentVersionIndexes?.[i] ?? 0;
            const displayUrl = resolveImageUrl(piece, i);

            return (
              <div key={`${piece.title}-${i}`} className="relative shrink-0 w-40">
                <button
                  onClick={() => setActiveIndex(i)}
                  className={`w-full rounded-xl overflow-hidden border-2 text-left transition-colors ${
                    i === activeIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={displayUrl}
                    alt={piece.title}
                    className="w-40 h-40 object-cover"
                  />
                </button>
                <p className="mt-1.5 text-xs text-text-light/60 truncate text-center">
                  {piece.title}
                </p>

                {/* Selection checkbox */}
                {onToggleSelect && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(i); }}
                    aria-label={isChecked ? `Deselect ${piece.title}` : `Select ${piece.title}`}
                    className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-primary border-primary text-white'
                        : 'bg-dark/60 border-white/40 hover:border-white'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Version navigation */}
                {hasMultipleVersions && onNavigateVersion && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-between px-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigateVersion(i, -1); }}
                      disabled={versionIdx === 0}
                      aria-label="Previous version"
                      className="w-6 h-6 rounded-full bg-dark/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-dark transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="text-[10px] bg-dark/70 rounded px-1 self-center text-white/70">
                      {versionIdx + 1}/{versions.length}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigateVersion(i, 1); }}
                      disabled={versionIdx === versions.length - 1}
                      aria-label="Next version"
                      className="w-6 h-6 rounded-full bg-dark/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-dark transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-72 lg:w-80 shrink-0 rounded-2xl bg-dark-secondary p-5 text-text-light">
        <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
          Details
        </p>
        <h4 className="font-bold text-text-light text-base">{active.title}</h4>

        {active.description && (
          <p className="mt-3 text-sm text-text-light/60 leading-relaxed">{active.description}</p>
        )}

        {(active.medium || active.dimensions || active.placement) && (
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs text-text-light/50">
            {active.medium && (
              <p><span className="font-medium text-text-light/70">Medium:</span> {active.medium}</p>
            )}
            {active.dimensions && (
              <p><span className="font-medium text-text-light/70">Dimensions:</span> {active.dimensions}</p>
            )}
            {active.placement && (
              <p><span className="font-medium text-text-light/70">Placement:</span> {active.placement}</p>
            )}
          </div>
        )}

        {/* Shopping links */}
        {active.type === 'poster' && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
              Get This Piece
            </p>
            {active.links?.frameUrl && (
              <a href={active.links.frameUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy a frame — {active.dimensions}
              </a>
            )}
            {active.links?.printUrl && (
              <a href={active.links.printUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Print this poster ({active.dimensions})
              </a>
            )}
            <button onClick={handleDownload}
              className="block text-sm text-primary hover:text-primary-hover transition-colors text-left cursor-pointer">
              Download artwork (frameless)
            </button>
          </div>
        )}

        {active.type === 'object' && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
              Get This Piece
            </p>
            {active.links?.objectUrl && (
              <a href={active.links.objectUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy this piece — {active.title}
              </a>
            )}
            {active.links?.mountingUrls.map(m => (
              <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy a {m.name}
              </a>
            ))}
          </div>
        )}

        {!active.type && (
          <button onClick={handleDownload}
            className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-medium text-text-light transition-colors cursor-pointer">
            Download for print
          </button>
        )}
      </div>
    </div>
  );
}
