'use client';

interface WizardSplitLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  photoUrl: string;
  styleName?: string;
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
  styleName,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next →',
  children,
}: WizardSplitLayoutProps) {
  const progressPct = (step / totalSteps) * 100;

  return (
    <div>
      {/* 3px full-width progress bar — above both panels */}
      <div className="w-full bg-border" style={{ height: '3px' }}>
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Split container */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        {/* Left panel — scrollable form area */}
        <div className="w-[42%] flex flex-col bg-surface border-r border-border">
          {/* Scrollable content */}
          <div className="flex flex-col flex-1 px-10 py-8 overflow-y-auto">
            {/* Step indicator */}
            <div className="mb-6">
              <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted font-semibold">
                Step {step} of {totalSteps}
              </p>
            </div>

            {/* Title + form content with gap */}
            <div className="flex flex-col gap-8 flex-1">
              <div>
                <h1 className="text-2xl font-bold text-text leading-tight tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
                )}
              </div>
              <div className="flex-1">{children}</div>
            </div>
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
          className="relative w-[58%] sticky top-14"
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          <img
            src={photoUrl}
            alt="Room inspiration"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {styleName && (
            <div className="absolute top-6 left-6 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-text">
              {styleName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
