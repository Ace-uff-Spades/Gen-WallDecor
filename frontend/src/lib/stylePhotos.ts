const BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?auto=format&fit=crop&w=1400&q=85';

function u(id: string): string {
  return `${BASE}${id}${PARAMS}`;
}

export const STYLE_PHOTOS: Record<string, string> = {
  default:              u('1592401526914-7e5d94a8d6fa'),  // modern living room with fireplace
  Transitional:         u('1600210491892-03d54c0aaf87'),  // transitional living room with beams and arched windows
  Traditional:          u('1615968679312-9b7ed9f04e79'),  // traditional dining room
  Modern:               u('1583847268964-b28dc8f51f92'),  // modern living room clean lines
  Eclectic:             u('1631509716275-59e9d106504a'),  // eclectic colorful living room
  Contemporary:         u('1600210492493-0946911123ea'),  // contemporary living room with floor-to-ceiling windows
  Minimalist:           u('1597293544475-16730f31a638'),  // minimalist all-white interior room
  'Mid Century Modern': u('1617228133035-2347f159e755'),  // mid century modern living room
  Bohemian:             u('1592485879438-a44150506ea9'),  // bohemian macrame and white interior
  'Modern Farmhouse':   u('1600489000360-34bd69182634'),  // modern farmhouse living room shiplap
  'Shabby Chic':        u('1629743381983-ce927ef135f8'),  // shabby chic vintage bedroom pastel
  Coastal:              u('1770414173168-f6c666501225'),  // coastal beach house bedroom
  'Hollywood Glam':     u('1638885930125-85350348d266'),  // glamorous luxury white living room
  Southwestern:         u('1761666254267-afe141cdc951'),  // southwestern dining room with desert macrame
  Rustic:               u('1680703486830-1b5af60635d7'),  // rustic cabin living room stone fireplace
  Industrial:           u('1617817643768-8855fc457e3a'),  // industrial loft exposed brick apartment
  'French Country':     u('1764076327046-fe35f955cba1'),  // french country dining room
  Scandinavian:         u('1605774337664-7a846e9cdf17'),  // scandinavian nordic living room
  Mediterranean:        u('1750271334785-4f6008035021'),  // mediterranean bedroom white and teal
  'Art Deco':           u('1771219491795-3b4dafc1cdf3'),  // art deco luxury interior with gold accents
  'Asian Zen':          u('1772034292097-447be2dd32ea'),  // japanese zen tatami room
};

export function getStylePhoto(styleName: string): string {
  return STYLE_PHOTOS[styleName] ?? STYLE_PHOTOS.default;
}
