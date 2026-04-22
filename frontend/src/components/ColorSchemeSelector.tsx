'use client';

const PRESET_COLORS = [
  'white', 'off-white', 'cream', 'beige', 'light gray', 'charcoal', 'black',
  'blush pink', 'burgundy', 'red accent', 'coral',
  'butter yellow', 'mustard', 'gold',
  'sage', 'olive', 'forest green', 'emerald', 'teal',
  'soft blue', 'ocean blue', 'cobalt blue', 'navy',
  'lavender', 'deep purple',
  'terracotta', 'burnt orange', 'rust',
  'sand', 'brown', 'warm earth tones', 'natural wood tones',
  'jewel tones',
];

interface ColorSchemeSelectorProps {
  selected: string[];
  onChange: (colors: string[]) => void;
}

export default function ColorSchemeSelector({ selected, onChange }: ColorSchemeSelectorProps) {
  const toggle = (color: string) => {
    if (selected.includes(color)) {
      onChange(selected.filter((c) => c !== color));
    } else {
      onChange([...selected, color]);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text">
        Color palette
        <span className="ml-1.5 text-xs text-text-muted font-normal">
          ({selected.length} selected)
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => toggle(color)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected.includes(color)
                ? 'bg-primary text-white'
                : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
            }`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
