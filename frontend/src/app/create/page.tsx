'use client';

import { useRouter } from 'next/navigation';
import { useCreationWizard } from '@/lib/useCreationWizard';
import { DECOR_STYLES } from '@/lib/styles';
import WizardLayout from '@/components/WizardLayout';
import StyleCard from '@/components/StyleCard';
import ColorSchemeSelector from '@/components/ColorSchemeSelector';
import FrameMaterialSelector from '@/components/FrameMaterialSelector';
import RoomContextForm from '@/components/RoomContextForm';

const STEP_TITLES = [
  'Choose Your Style',
  'Visual Preferences',
  'Room Context',
];

export default function CreatePage() {
  const router = useRouter();
  const {
    state,
    setStyle,
    setColorScheme,
    setFrameMaterial,
    setRoomType,
    setDimensions,
    nextStep,
    prevStep,
  } = useCreationWizard();

  const handleNext = () => {
    if (state.step === 3) {
      // Final step — navigate to generate page with preferences in URL state
      const params = new URLSearchParams({
        style: state.style,
        colors: state.colorScheme.join(','),
        frame: state.frameMaterial,
        room: state.roomType,
        ...(state.wallWidth ? { w: String(state.wallWidth) } : {}),
        ...(state.wallHeight ? { h: String(state.wallHeight) } : {}),
      });
      router.push(`/generate?${params.toString()}`);
      return;
    }

    // When selecting a style, auto-fill defaults for step 2
    if (state.step === 1) {
      const selected = DECOR_STYLES.find((s) => s.name === state.style);
      if (selected && state.colorScheme.length === 0) {
        setColorScheme(selected.defaultColorScheme);
        setFrameMaterial(selected.defaultFrameMaterial);
      }
    }

    nextStep();
  };

  const isNextDisabled = () => {
    switch (state.step) {
      case 1: return !state.style;
      case 2: return state.colorScheme.length === 0 || !state.frameMaterial;
      case 3: return !state.roomType;
      default: return false;
    }
  };

  return (
    <WizardLayout
      step={state.step}
      totalSteps={3}
      title={STEP_TITLES[state.step - 1]}
      onNext={handleNext}
      onBack={state.step > 1 ? prevStep : undefined}
      nextDisabled={isNextDisabled()}
      nextLabel={state.step === 3 ? 'Generate' : 'Next'}
    >
      {state.step === 1 && (
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
      )}

      {state.step === 2 && (
        <div className="space-y-8">
          <ColorSchemeSelector
            selected={state.colorScheme}
            onChange={setColorScheme}
          />
          <FrameMaterialSelector
            selected={state.frameMaterial}
            onChange={setFrameMaterial}
          />
        </div>
      )}

      {state.step === 3 && (
        <RoomContextForm
          roomType={state.roomType}
          wallWidth={state.wallWidth}
          wallHeight={state.wallHeight}
          onRoomTypeChange={setRoomType}
          onDimensionsChange={setDimensions}
        />
      )}
    </WizardLayout>
  );
}
