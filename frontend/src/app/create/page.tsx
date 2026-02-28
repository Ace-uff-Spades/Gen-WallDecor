'use client';

import { useRouter } from 'next/navigation';
import { useCreationWizard } from '@/lib/useCreationWizard';
import { DECOR_STYLES } from '@/lib/styles';
import WizardLayout from '@/components/WizardLayout';
import StyleCard from '@/components/StyleCard';

export default function CreatePage() {
  const router = useRouter();
  const { state, setStyle, nextStep } = useCreationWizard();

  const handleNext = () => {
    nextStep();
    // Steps 2-3 will be added in Task 16; for now step 1 -> generate
    if (state.step >= 1) {
      // Will be replaced with proper step routing in Task 16
    }
  };

  return (
    <WizardLayout
      step={1}
      totalSteps={3}
      title="Choose Your Style"
      onNext={handleNext}
      nextDisabled={!state.style}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DECOR_STYLES.map((style) => (
          <StyleCard
            key={style.name}
            style={style}
            selected={state.style === style.name}
            onSelect={() => setStyle(style.name)}
          />
        ))}
      </div>
    </WizardLayout>
  );
}
