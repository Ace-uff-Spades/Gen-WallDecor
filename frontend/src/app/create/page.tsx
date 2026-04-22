'use client';

import { useRouter } from 'next/navigation';
import { useCreationWizard } from '@/lib/useCreationWizard';
import { DECOR_STYLES } from '@/lib/styles';
import { getStylePhoto } from '@/lib/stylePhotos';
import WizardSplitLayout from '@/components/WizardSplitLayout';
import StyleCard from '@/components/StyleCard';
import ColorSchemeSelector from '@/components/ColorSchemeSelector';
import FrameMaterialSelector from '@/components/FrameMaterialSelector';
import RoomContextForm from '@/components/RoomContextForm';

const STEP_TITLES = ['Choose Your Style', 'Visual Preferences', 'Your Room'];
const STEP_SUBTITLES = [
  'Pick a look that matches your space.',
  'Set the color palette and frame style.',
  'Tell us about the room.',
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

  const photoUrl = getStylePhoto(state.style);

  return (
    <WizardSplitLayout
      step={state.step}
      totalSteps={3}
      title={STEP_TITLES[state.step - 1]}
      subtitle={STEP_SUBTITLES[state.step - 1]}
      photoUrl={photoUrl}
      onNext={handleNext}
      onBack={state.step > 1 ? prevStep : undefined}
      nextDisabled={isNextDisabled()}
      nextLabel={state.step === 3 ? 'Generate →' : 'Next →'}
    >
      {state.step === 1 && (
        <div className="grid grid-cols-2 gap-3">
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
    </WizardSplitLayout>
  );
}
