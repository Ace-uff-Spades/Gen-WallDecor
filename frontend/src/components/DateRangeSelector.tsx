'use client';

export type Preset = '7d' | '14d' | '30d' | 'custom';

export interface DateRange {
  preset: Preset;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function presetToDays(preset: Preset): number {
  if (preset === '7d') return 7;
  if (preset === '14d') return 14;
  return 30;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = localDateStr(today);
  const from = new Date(today);
  from.setDate(from.getDate() - presetToDays(preset) + 1);
  return { from: localDateStr(from), to };
}

export function getDefaultRange(preset: Preset = '7d'): DateRange {
  return { preset, ...computeRange(preset) };
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: Preset[] = ['7d', '14d', '30d', 'custom'];
const today = localDateStr(new Date());

export default function DateRangeSelector({ value, onChange }: Props) {
  const handlePreset = (preset: Preset) => {
    if (preset === 'custom') {
      onChange({ ...value, preset: 'custom' });
    } else {
      onChange({ preset, ...computeRange(preset) });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => handlePreset(p)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value.preset === p
              ? 'bg-primary text-white'
              : 'bg-secondary/60 text-text-darker hover:bg-secondary'
          }`}
        >
          {p === 'custom' ? 'Custom' : p.toUpperCase()}
        </button>
      ))}
      {value.preset === 'custom' && (
        <>
          <input
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="rounded-lg border border-secondary px-2 py-1 text-xs text-text-darker focus:border-primary focus:outline-none"
          />
          <span className="text-xs text-text-dark">to</span>
          <input
            type="date"
            value={value.to}
            min={value.from}
            max={today}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="rounded-lg border border-secondary px-2 py-1 text-xs text-text-darker focus:border-primary focus:outline-none"
          />
        </>
      )}
    </div>
  );
}
