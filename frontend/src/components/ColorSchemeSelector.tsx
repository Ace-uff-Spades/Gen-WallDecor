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
      <p className="mb-3 text-sm text-text-dark">
        Select colors for your wall decor ({selected.length} selected)
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => toggle(color)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-all ${
              selected.includes(color)
                ? 'bg-primary text-white'
                : 'bg-secondary/40 text-text-dark hover:bg-secondary/70'
            }`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
