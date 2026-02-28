'use client';

interface Piece {
  title: string;
  imageUrl: string;
}

interface PieceGalleryProps {
  pieces: Piece[];
}

export default function PieceGallery({ pieces }: PieceGalleryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pieces.map((piece, i) => (
        <div key={i} className="rounded-2xl border border-secondary/60 bg-white overflow-hidden">
          <img
            src={piece.imageUrl}
            alt={piece.title}
            className="aspect-square w-full object-cover"
          />
          <div className="p-4">
            <h3 className="text-sm font-bold text-text-darker">{piece.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
