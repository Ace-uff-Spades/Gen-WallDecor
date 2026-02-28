'use client';

import { FRAME_MATERIALS } from '@/lib/styles';

interface FrameMaterialSelectorProps {
  selected: string;
  onChange: (material: string) => void;
}

export default function FrameMaterialSelector({ selected, onChange }: FrameMaterialSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-sm text-text-dark">Choose a frame material</p>
      <div className="flex flex-wrap gap-2">
        {FRAME_MATERIALS.map((material) => (
          <button
            key={material}
            onClick={() => onChange(material)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm transition-all ${
              selected === material
                ? 'bg-primary text-white'
                : 'bg-secondary/40 text-text-dark hover:bg-secondary/70'
            }`}
          >
            {material}
          </button>
        ))}
      </div>
    </div>
  );
}
