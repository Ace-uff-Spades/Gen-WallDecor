import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: "\u{1F3A8}",
    title: "Choose Your Style",
    description: "Pick from 20 curated decor styles that match your taste and space.",
  },
  {
    number: 2,
    icon: "\u{270F}\uFE0F",
    title: "Review AI Descriptions",
    description:
      "AI creates detailed art piece descriptions tailored to your chosen style.",
  },
  {
    number: 3,
    icon: "\u{1F5BC}\uFE0F",
    title: "See Your Wall",
    description:
      "Get a complete wall visualization with AI-generated artwork ready to order.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 pt-24 pb-20 md:pt-36 md:pb-28 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-text-darker tracking-tight leading-tight">
          Design Your Perfect Wall
        </h1>
        <p className="mt-6 text-lg md:text-xl text-text-dark max-w-xl mx-auto leading-relaxed">
          AI-powered wall decor that matches your style. Choose a look, and
          let AI bring your vision to life.
        </p>
        <Link
          href="/create"
          className="mt-10 inline-block rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start Creating
        </Link>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-20 md:py-28">
        <h2 className="text-2xl md:text-3xl font-bold text-text-darker text-center mb-14">
          How It Works
        </h2>
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl bg-secondary/40 p-8 text-center"
            >
              <span className="text-4xl" role="img" aria-label={step.title}>
                {step.icon}
              </span>
              <p className="mt-4 text-sm font-semibold text-primary">
                Step {step.number}
              </p>
              <h3 className="mt-2 text-xl font-bold text-text-darker">
                {step.title}
              </h3>
              <p className="mt-3 text-text-dark leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 md:py-28 text-center">
        <div className="max-w-xl mx-auto rounded-2xl bg-secondary/50 px-8 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-text-darker">
            Ready to transform your space?
          </h2>
          <p className="mt-4 text-text-dark">
            It only takes a few minutes to create something beautiful.
          </p>
          <Link
            href="/create"
            className="mt-8 inline-block rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
