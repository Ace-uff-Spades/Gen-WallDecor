import Link from 'next/link';

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1724582586529-62622e50c0b3?auto=format&fit=crop&w=1800&q=85';

const STEP_PILLS = [
  { number: '01', label: 'Style' },
  { number: '02', label: 'Describe' },
  { number: '03', label: 'Your Wall' },
];

export default function Home() {
  return (
    <main
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      {/* Full-bleed hero photo */}
      <img
        src={HERO_PHOTO}
        alt="Room inspiration"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(8,18,32,0.30) 0%, rgba(8,18,32,0.20) 30%, rgba(8,18,32,0.45) 70%, rgba(8,18,32,0.75) 100%)',
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between px-16 py-12">
        {/* Top: eyebrow + headline + subtitle + CTA */}
        <div className="max-w-lg mt-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/50 mb-5">
            AI Wall Decor
          </p>
          <h1 className="text-[52px] font-bold tracking-tight text-white leading-[1.1] mb-4">
            Design Your
            <br />
            <span style={{ color: '#7BB8E0' }}>Perfect Wall</span>
          </h1>
          <p className="text-[15px] text-white/60 mb-8 max-w-[380px] leading-relaxed">
            AI-powered wall decor that matches your style.
          </p>
          <Link
            href="/create"
            className="inline-block rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#1B3A5C',
              boxShadow: '0 4px 16px rgba(27,58,92,0.45)',
            }}
          >
            Start Creating →
          </Link>
        </div>

        {/* Bottom: step pills */}
        <div className="flex items-center gap-4">
          {STEP_PILLS.map((pill) => (
            <div
              key={pill.number}
              className="flex items-center gap-2.5 rounded-full px-4 py-2"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <span className="font-mono text-xs text-white/50">{pill.number}</span>
              <span className="text-sm font-semibold text-white">{pill.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
