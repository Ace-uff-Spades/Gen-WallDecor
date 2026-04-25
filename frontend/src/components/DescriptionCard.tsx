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

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="relative group">
      <label className="mb-1 block text-xs font-medium text-text-muted">{label}</label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none resize-none"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
        )}
        {/* Pencil icon — appears on hover as an edit affordance */}
        <svg
          className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>
    </div>
  );
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
        isExpanded
          ? 'border-primary/60 shadow-sm'
          : 'border-border opacity-75'
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
            <EditableField
              label="Title"
              value={draft.title}
              onChange={(val) => setDraft({ ...draft, title: val })}
            />
            <EditableField
              label="Description"
              value={draft.description}
              onChange={(val) => setDraft({ ...draft, description: val })}
              multiline
            />
            <div className="grid grid-cols-3 gap-3">
              <EditableField
                label="Medium"
                value={draft.medium}
                onChange={(val) => setDraft({ ...draft, medium: val })}
              />
              <EditableField
                label="Dimensions"
                value={draft.dimensions}
                onChange={(val) => setDraft({ ...draft, dimensions: val })}
              />
              <EditableField
                label="Placement"
                value={draft.placement}
                onChange={(val) => setDraft({ ...draft, placement: val })}
              />
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
