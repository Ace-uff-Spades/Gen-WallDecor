export interface UserPreferences {
  style: string;
  colorScheme: string[];
  frameMaterial: string;
  roomType: string;
  wallDimensions?: { width: number; height: number };
}

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
}

export interface GenerationRequest {
  preferences: UserPreferences;
  feedback?: string;
}
