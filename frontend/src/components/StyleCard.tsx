'use client';

import { DecorStyle } from '@/lib/styles';

interface StyleCardProps {
  style: DecorStyle;
  selected: boolean;
  onSelect: () => void;
}

export default function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-secondary/60 bg-white hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      <h3 className="text-base font-bold text-text-darker">{style.name}</h3>
      <p className="mt-1 text-sm text-text-dark leading-relaxed">
        {style.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {style.defaultColorScheme.map((color) => (
          <span
            key={color}
            className="rounded-full bg-secondary/50 px-2.5 py-0.5 text-xs text-text-dark"
          >
            {color}
          </span>
        ))}
      </div>
    </button>
  );
}
