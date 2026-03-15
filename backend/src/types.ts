export interface UserPreferences {
  style: string;
  colorScheme: string[];
  frameMaterial: string;
  roomType: string;
  wallDimensions?: { width: number; height: number };
}

export type PieceType = 'poster' | 'object';

export interface FrameRecommendation {
  material: string;  // e.g. "natural wood"
  color: string;     // e.g. "warm oak"
  style: string;     // e.g. "rustic"
}

export interface MountingRequirement {
  name: string;         // e.g. "floating shelf"
  searchQuery: string;  // used to build Google Shopping URL
}

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
  type: PieceType;
  position: { x: number; y: number };            // 0–100%, approximate center on wall render
  frameRecommendation?: FrameRecommendation;     // poster only
  mountingRequirements?: MountingRequirement[];  // object only
}

export interface GenerationRequest {
  preferences: UserPreferences;
  feedback?: string;
  previousDescriptions?: PieceDescription[];
}
