'use client';

import { useState } from 'react';

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
  onUpdate: (updated: PieceDescription) => void;
}

export default function DescriptionCard({ piece, index, onUpdate }: DescriptionCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(piece);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(piece);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-white p-6">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dark">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dark">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker focus:border-primary focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dark">Medium</label>
              <input
                value={draft.medium}
                onChange={(e) => setDraft({ ...draft, medium: e.target.value })}
                className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dark">Dimensions</label>
              <input
                value={draft.dimensions}
                onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
                className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dark">Placement</label>
              <input
                value={draft.placement}
                onChange={(e) => setDraft({ ...draft, placement: e.target.value })}
                className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-text-darker focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-primary">Piece {index + 1}</p>
          <h3 className="mt-1 text-lg font-bold text-text-darker">{piece.title}</h3>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-text-dark hover:bg-secondary/50 transition-colors"
        >
          Edit
        </button>
      </div>
      <p className="mt-2 text-sm text-text-dark leading-relaxed">{piece.description}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-dark">
        <span className="rounded-full bg-secondary/40 px-2.5 py-1">{piece.medium}</span>
        <span className="rounded-full bg-secondary/40 px-2.5 py-1">{piece.dimensions}</span>
        <span className="rounded-full bg-secondary/40 px-2.5 py-1">{piece.placement}</span>
      </div>
    </div>
  );
}
