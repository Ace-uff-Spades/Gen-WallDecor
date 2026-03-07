'use client';

import { useState } from 'react';

interface Piece {
  title: string;
  imageUrl: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  placement?: string;
}

interface PieceGalleryProps {
  pieces: Piece[];
}

function PieceCard({ piece }: { piece: Piece }) {
  const [open, setOpen] = useState(false);
  const hasDescription = piece.description || piece.medium || piece.dimensions || piece.placement;

  const handleDownload = async () => {
    try {
      const res = await fetch(piece.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${piece.title}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white overflow-hidden">
      <img
        src={piece.imageUrl}
        alt={piece.title}
        className="aspect-square w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-text-darker">{piece.title}</h3>
          <button
            onClick={handleDownload}
            title="Download for print"
            className="shrink-0 rounded-lg p-1.5 text-text-dark hover:bg-secondary/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {hasDescription && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-2 flex items-center gap-1 text-xs text-text-dark hover:text-text-darker transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {open ? 'Hide description' : 'View description'}
          </button>
        )}
        {open && (
          <div className="mt-3 space-y-1.5 border-t border-secondary/60 pt-3 text-xs text-text-dark">
            {piece.description && <p className="leading-relaxed">{piece.description}</p>}
            {piece.medium && (
              <p><span className="font-medium text-text-darker">Medium:</span> {piece.medium}</p>
            )}
            {piece.dimensions && (
              <p><span className="font-medium text-text-darker">Dimensions:</span> {piece.dimensions}</p>
            )}
            {piece.placement && (
              <p><span className="font-medium text-text-darker">Placement:</span> {piece.placement}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PieceGallery({ pieces }: PieceGalleryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pieces.map((piece, i) => (
        <PieceCard key={`${piece.title}-${i}`} piece={piece} />
      ))}
    </div>
  );
}
