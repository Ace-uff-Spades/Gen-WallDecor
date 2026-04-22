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
      className={`relative w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-orange-50'
          : 'border-border bg-white hover:border-text-muted hover:shadow-sm'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <p className="pr-6 text-sm font-semibold text-text">{style.name}</p>
      <p className="mt-0.5 text-xs text-text-muted">{style.description}</p>
    </button>
  );
}
