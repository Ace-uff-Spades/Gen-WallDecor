'use client';

import { ROOM_TYPES } from '@/lib/styles';

interface RoomContextFormProps {
  roomType: string;
  wallWidth?: number;
  wallHeight?: number;
  onRoomTypeChange: (roomType: string) => void;
  onDimensionsChange: (width?: number, height?: number) => void;
}

export default function RoomContextForm({
  roomType,
  wallWidth,
  wallHeight,
  onRoomTypeChange,
  onDimensionsChange,
}: RoomContextFormProps) {
  return (
    <div className="space-y-8">
      {/* Room type */}
      <div>
        <p className="mb-3 text-sm font-medium text-text">Room type</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((room) => (
            <button
              key={room}
              onClick={() => onRoomTypeChange(room)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                roomType === room
                  ? 'bg-primary text-white'
                  : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* Wall dimensions */}
      <div>
        <p className="mb-1 text-sm font-medium text-text">
          Wall dimensions
          <span className="ml-1.5 text-xs text-text-muted font-normal">(optional, in feet)</span>
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex-1">
            <label htmlFor="wall-width" className="mb-1 block text-xs text-text-muted">
              Width
            </label>
            <input
              id="wall-width"
              type="number"
              min={1}
              max={50}
              value={wallWidth ?? ''}
              onChange={(e) =>
                onDimensionsChange(
                  e.target.value ? Number(e.target.value) : undefined,
                  wallHeight,
                )
              }
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="wall-height" className="mb-1 block text-xs text-text-muted">
              Height
            </label>
            <input
              id="wall-height"
              type="number"
              min={1}
              max={50}
              value={wallHeight ?? ''}
              onChange={(e) =>
                onDimensionsChange(
                  wallWidth,
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="e.g. 9"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
