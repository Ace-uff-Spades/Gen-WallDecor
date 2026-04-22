'use client';

import { useState, useEffect } from 'react';

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
}

interface DescriptionCardProps {
  piece: PieceDescription;
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onUpdate: (updated: PieceDescription) => void;
}

export default function DescriptionCard({
  piece,
  index,
  isExpanded,
  onExpand,
  onUpdate,
}: DescriptionCardProps) {
  const [draft, setDraft] = useState(piece);

  // When parent regenerates descriptions, sync the local draft (but not while user is editing)
  useEffect(() => {
    if (!isExpanded) {
      setDraft(piece);
    }
  }, [piece]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    onUpdate(draft);
    onExpand(); // toggles off — collapses the card
  };

  const handleCancel = () => {
    setDraft(piece);
    onExpand(); // toggles off — collapses the card
  };

  return (
    <div
      className={`rounded-xl border bg-white transition-all ${
        isExpanded ? 'border-primary shadow-sm' : 'border-border'
      }`}
    >
      {/* Header — always visible, click to expand */}
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-widest uppercase text-primary mb-0.5">
            Piece {index + 1}
          </p>
          <p className="text-sm font-semibold text-text truncate">{piece.title}</p>
          {!isExpanded && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{piece.description}</p>
          )}
        </div>
        <svg
          className={`ml-3 shrink-0 h-4 w-4 text-text-muted transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Medium</label>
                <input
                  value={draft.medium}
                  onChange={(e) => setDraft({ ...draft, medium: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Dimensions</label>
                <input
                  value={draft.dimensions}
                  onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Placement</label>
                <input
                  value={draft.placement}
                  onChange={(e) => setDraft({ ...draft, placement: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="cursor-pointer rounded-lg bg-primary hover:bg-primary-hover px-4 py-1.5 text-sm font-medium text-white transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Metadata chips — only when collapsed */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {piece.medium && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.medium}
            </span>
          )}
          {piece.dimensions && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.dimensions}
            </span>
          )}
          {piece.placement && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.placement}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
