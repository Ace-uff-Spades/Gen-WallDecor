'use client';

interface WizardLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}

export default function WizardLayout({
  step,
  totalSteps,
  title,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next',
  children,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm font-medium text-text-dark">
            Step {step} of {totalSteps}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-10 rounded-full transition-colors ${
                  i < step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-8 text-2xl font-bold text-text-darker md:text-3xl">
          {title}
        </h1>

        {/* Content */}
        <div className="mb-10">{children}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="rounded-xl px-6 py-3 text-sm font-medium text-text-dark transition-colors hover:bg-secondary cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
