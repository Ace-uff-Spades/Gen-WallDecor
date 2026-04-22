const BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?auto=format&fit=crop&w=1400&q=85';

function u(id: string): string {
  return `${BASE}${id}${PARAMS}`;
}

export const STYLE_PHOTOS: Record<string, string> = {
  default:              u('jr8aU_w3zyk'),  // modern living room
  Transitional:         u('5hWxhXzM8WQ'),  // transitional living room
  Traditional:          u('vfVGrbBCYLI'),  // elegant living room with chandelier
  Modern:               u('OtXADkUh3-I'),  // modern interior clean lines
  Eclectic:             u('excNzfxAV10'),  // eclectic colorful room
  Contemporary:         u('r6J0hko5sQE'),  // contemporary sleek interior
  Minimalist:           u('Faa_P3eaaGo'),  // minimalist white interior
  'Mid Century Modern': u('KPK_Qn2Pc5s'),  // mid century modern living room
  Bohemian:             u('q4jmjMMC2UU'),  // bohemian cozy interior
  'Modern Farmhouse':   u('qWXGmMRe4so'),  // modern farmhouse interior
  'Shabby Chic':        u('6l_oVz7IKtM'),  // shabby chic vintage pastel
  Coastal:              u('waQqmXlezGE'),  // coastal bright living room
  'Hollywood Glam':     u('C4XJ0NggHh8'),  // glamorous luxury interior
  Southwestern:         u('JTLUyOFgWJg'),  // southwestern arched hallway
  Rustic:               u('s-ZJpt0UdpU'),  // rustic natural wood interior
  Industrial:           u('O7slumf2XIk'),  // industrial loft interior
  'French Country':     u('lGWmTzCyEB8'),  // french country dining room
  Scandinavian:         u('fobX0HI9vVo'),  // scandinavian nordic interior
  Mediterranean:        u('s1agXbSAjy4'),  // mediterranean villa interior
  'Art Deco':           u('CPL-1HtNlMs'),  // art deco geometric interior
  'Asian Zen':          u('3JuGRalgaEE'),  // japanese zen interior
};

export function getStylePhoto(styleName: string): string {
  return STYLE_PHOTOS[styleName] ?? STYLE_PHOTOS.default;
}
