import Link from 'next/link';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1800&q=85';

const steps = [
  {
    number: 1,
    title: 'Choose Your Style',
    description: 'Pick from 20 curated decor styles that match your taste and space.',
  },
  {
    number: 2,
    title: 'Review AI Descriptions',
    description: 'AI creates detailed art piece descriptions tailored to your chosen style.',
  },
  {
    number: 3,
    title: 'See Your Wall',
    description: 'Get a full wall visualization with AI-generated artwork ready to order.',
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero — full viewport height */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          backgroundImage: `url(${HERO_PHOTO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-10 py-12 border border-white/20">
            <p className="font-mono text-[11px] tracking-widest uppercase text-white/60 mb-5">
              GenWallDecor
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-5">
              Design Your<br />Perfect Wall
            </h1>
            <p className="text-base text-white/75 mb-8 leading-relaxed">
              AI-powered wall decor that matches your style.
            </p>
            <Link
              href="/create"
              className="inline-block rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 text-sm font-semibold text-white transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted mb-3">
            How It Works
          </p>
          <h2 className="text-3xl font-bold text-text mb-14">
            Three steps to your perfect wall
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl bg-bg p-8 text-left shadow-sm"
              >
                <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-3">
                  Step {step.number}
                </p>
                <h3 className="text-base font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="bg-dark py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-text-light mb-1">
              Ready to transform your space?
            </h2>
            <p className="text-sm text-text-light/50">
              It only takes a few minutes to create something beautiful.
            </p>
          </div>
          <Link
            href="/create"
            className="shrink-0 rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </main>
  );
}
