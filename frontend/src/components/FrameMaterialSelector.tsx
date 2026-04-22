'use client';

import { FRAME_MATERIALS } from '@/lib/styles';

interface FrameMaterialSelectorProps {
  selected: string;
  onChange: (material: string) => void;
}

export default function FrameMaterialSelector({ selected, onChange }: FrameMaterialSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text">Frame material</p>
      <div className="flex flex-wrap gap-2">
        {FRAME_MATERIALS.map((material) => (
          <button
            key={material}
            onClick={() => onChange(material)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === material
                ? 'bg-primary text-white'
                : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
            }`}
          >
            {material}
          </button>
        ))}
      </div>
    </div>
  );
}
