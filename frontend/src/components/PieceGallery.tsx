'use client';

import { useState } from 'react';
import { api } from '../lib/api';

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
  generationId: string;
}

export default function PieceGallery({ pieces, generationId }: PieceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = pieces[selectedIndex];

  const handleDownload = async () => {
    try {
      const { url } = await api.getPieceDownloadUrl(generationId, selectedIndex);
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${selected.title}.png`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Thumbnail grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
        {pieces.map((piece, i) => (
          <button
            key={`${piece.title}-${i}`}
            onClick={() => setSelectedIndex(i)}
            className={`rounded-xl overflow-hidden border-2 text-left transition-colors ${
              i === selectedIndex
                ? 'border-primary'
                : 'border-transparent hover:border-secondary'
            }`}
          >
            <img
              src={piece.imageUrl}
              alt={piece.title}
              className="aspect-square w-full object-cover"
            />
            <div className="bg-white px-2 py-1.5">
              <p className="text-xs font-medium text-text-darker truncate">{piece.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Description panel */}
      <div className="w-72 lg:w-80 shrink-0 sticky top-24 rounded-2xl border border-secondary/60 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dark">Details</h3>
        <h4 className="mt-2 font-bold text-text-darker">{selected.title}</h4>
        {selected.description && (
          <p className="mt-3 text-sm text-text-dark leading-relaxed">{selected.description}</p>
        )}
        {(selected.medium || selected.dimensions || selected.placement) && (
          <div className="mt-4 space-y-1.5 border-t border-secondary/60 pt-4 text-xs text-text-dark">
            {selected.medium && (
              <p><span className="font-medium text-text-darker">Medium:</span> {selected.medium}</p>
            )}
            {selected.dimensions && (
              <p><span className="font-medium text-text-darker">Dimensions:</span> {selected.dimensions}</p>
            )}
            {selected.placement && (
              <p><span className="font-medium text-text-darker">Placement:</span> {selected.placement}</p>
            )}
          </div>
        )}
        <button
          onClick={handleDownload}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary/60 px-4 py-2 text-sm font-medium text-text-darker hover:bg-secondary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download for print
        </button>
      </div>
    </div>
  );
}
