'use client';

import { useState, useCallback } from 'react';

export interface WizardState {
  step: number;
  style: string;
  colorScheme: string[];
  frameMaterial: string;
  roomType: string;
  wallWidth?: number;
  wallHeight?: number;
}

const initialState: WizardState = {
  step: 1,
  style: '',
  colorScheme: [],
  frameMaterial: '',
  roomType: '',
};

export function useCreationWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const setStyle = useCallback((style: string) => {
    setState(prev => ({ ...prev, style }));
  }, []);

  const setColorScheme = useCallback((colorScheme: string[]) => {
    setState(prev => ({ ...prev, colorScheme }));
  }, []);

  const setFrameMaterial = useCallback((frameMaterial: string) => {
    setState(prev => ({ ...prev, frameMaterial }));
  }, []);

  const setRoomType = useCallback((roomType: string) => {
    setState(prev => ({ ...prev, roomType }));
  }, []);

  const setDimensions = useCallback((width?: number, height?: number) => {
    setState(prev => ({ ...prev, wallWidth: width, wallHeight: height }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const getPreferences = useCallback(() => ({
    style: state.style,
    colorScheme: state.colorScheme,
    frameMaterial: state.frameMaterial,
    roomType: state.roomType,
    ...(state.wallWidth && state.wallHeight
      ? { wallDimensions: { width: state.wallWidth, height: state.wallHeight } }
      : {}),
  }), [state]);

  return {
    state,
    setStyle,
    setColorScheme,
    setFrameMaterial,
    setRoomType,
    setDimensions,
    nextStep,
    prevStep,
    reset,
    getPreferences,
  };
}
