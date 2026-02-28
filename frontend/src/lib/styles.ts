export interface DecorStyle {
  name: string;
  description: string;
  defaultColorScheme: string[];
  defaultFrameMaterial: string;
}

export const DECOR_STYLES: DecorStyle[] = [
  { name: 'Transitional', description: 'Blend of traditional and contemporary', defaultColorScheme: ['beige', 'gray', 'cream'], defaultFrameMaterial: 'dark wood' },
  { name: 'Traditional', description: 'Classic elegance with ornate details', defaultColorScheme: ['burgundy', 'gold', 'navy'], defaultFrameMaterial: 'ornate gold' },
  { name: 'Modern', description: 'Clean lines and bold statements', defaultColorScheme: ['black', 'white', 'red accent'], defaultFrameMaterial: 'black metal' },
  { name: 'Eclectic', description: 'Mix of patterns, textures, and eras', defaultColorScheme: ['jewel tones', 'mustard', 'teal'], defaultFrameMaterial: 'mixed materials' },
  { name: 'Contemporary', description: 'Current trends with sleek aesthetics', defaultColorScheme: ['neutral gray', 'white', 'charcoal'], defaultFrameMaterial: 'brushed silver' },
  { name: 'Minimalist', description: 'Less is more — intentional simplicity', defaultColorScheme: ['white', 'off-white', 'light gray'], defaultFrameMaterial: 'thin white' },
  { name: 'Mid Century Modern', description: 'Retro 1950s-60s inspired warmth', defaultColorScheme: ['olive', 'burnt orange', 'mustard'], defaultFrameMaterial: 'walnut' },
  { name: 'Bohemian', description: 'Free-spirited with global influences', defaultColorScheme: ['terracotta', 'warm earth tones', 'sage'], defaultFrameMaterial: 'natural wood' },
  { name: 'Modern Farmhouse', description: 'Rustic charm meets modern comfort', defaultColorScheme: ['white', 'sage green', 'natural wood tones'], defaultFrameMaterial: 'distressed wood' },
  { name: 'Shabby Chic', description: 'Vintage elegance with soft pastels', defaultColorScheme: ['blush pink', 'cream', 'soft blue'], defaultFrameMaterial: 'whitewashed wood' },
  { name: 'Coastal', description: 'Beach-inspired relaxation', defaultColorScheme: ['ocean blue', 'sandy beige', 'seafoam'], defaultFrameMaterial: 'light driftwood' },
  { name: 'Hollywood Glam', description: 'Luxurious and dramatic', defaultColorScheme: ['black', 'gold', 'deep purple'], defaultFrameMaterial: 'mirrored gold' },
  { name: 'Southwestern', description: 'Desert-inspired warmth', defaultColorScheme: ['turquoise', 'terracotta', 'sand'], defaultFrameMaterial: 'rustic wood' },
  { name: 'Rustic', description: 'Raw natural beauty', defaultColorScheme: ['brown', 'forest green', 'cream'], defaultFrameMaterial: 'reclaimed barn wood' },
  { name: 'Industrial', description: 'Urban warehouse aesthetic', defaultColorScheme: ['charcoal', 'rust', 'concrete gray'], defaultFrameMaterial: 'black iron pipe' },
  { name: 'French Country', description: 'Provincial elegance', defaultColorScheme: ['lavender', 'butter yellow', 'soft blue'], defaultFrameMaterial: 'aged gilt' },
  { name: 'Scandinavian', description: 'Nordic simplicity and warmth', defaultColorScheme: ['white', 'pale pink', 'light wood'], defaultFrameMaterial: 'light birch' },
  { name: 'Mediterranean', description: 'Sun-drenched warmth', defaultColorScheme: ['terracotta', 'cobalt blue', 'olive'], defaultFrameMaterial: 'wrought iron' },
  { name: 'Art Deco', description: 'Geometric glamour of the 1920s', defaultColorScheme: ['gold', 'black', 'emerald'], defaultFrameMaterial: 'gold geometric' },
  { name: 'Asian Zen', description: 'Peaceful minimalist harmony', defaultColorScheme: ['bamboo green', 'black', 'cream'], defaultFrameMaterial: 'bamboo' },
];

export const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Home Office',
  'Hallway',
  'Bathroom',
  'Kitchen',
  'Nursery',
];

export const FRAME_MATERIALS = [
  'Natural Wood',
  'Dark Wood',
  'Walnut',
  'Light Birch',
  'Black Metal',
  'Gold Metal',
  'Brushed Silver',
  'White',
  'Distressed Wood',
  'Bamboo',
  'Frameless',
];
