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
    <div className="space-y-6">
      <div>
        <label htmlFor="room-type" className="mb-2 block text-sm font-medium text-text-darker">
          Room Type
        </label>
        <select
          id="room-type"
          value={roomType}
          onChange={(e) => onRoomTypeChange(e.target.value)}
          className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-text-darker focus:border-primary focus:outline-none"
        >
          <option value="">Select a room...</option>
          {ROOM_TYPES.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-darker">
          Wall Dimensions <span className="font-normal text-text-dark">(optional, in feet)</span>
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="wall-width" className="mb-1 block text-xs text-text-dark">
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
              className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-text-darker focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="wall-height" className="mb-1 block text-xs text-text-dark">
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
              className="w-full rounded-xl border border-secondary bg-white px-4 py-3 text-sm text-text-darker focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
