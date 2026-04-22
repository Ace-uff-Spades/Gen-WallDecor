'use client';

interface WizardSplitLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  photoUrl: string;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}

export default function WizardSplitLayout({
  step,
  totalSteps,
  title,
  subtitle,
  photoUrl,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next →',
  children,
}: WizardSplitLayoutProps) {
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Left panel — scrollable form area */}
      <div className="w-[42%] flex flex-col bg-surface border-r border-border">
        {/* Scrollable content */}
        <div className="flex flex-col flex-1 px-10 py-8 overflow-y-auto">
          {/* Step indicator */}
          <div className="mb-6">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted mb-2">
              Step {step} of {totalSteps}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-primary' : 'bg-step-inactive'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-text leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}

          {/* Form content */}
          <div className="mt-6 flex-1">{children}</div>
        </div>

        {/* Navigation — pinned to bottom */}
        <div className="flex items-center justify-between border-t border-border px-10 py-4 bg-surface">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-sm font-medium text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>

      {/* Right panel — sticky photo */}
      <div
        className="w-[58%] sticky top-14"
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        <img
          src={photoUrl}
          alt="Room inspiration"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    </div>
  );
}
