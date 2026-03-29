export function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h, s, l };
}

export const GalaxyType = {
  NEBULA: 'NEBULA',           // 0-60
  STARBURST: 'STARBURST',     // 60-120
  CLUSTER: 'CLUSTER',         // 120-180
  SPIRAL: 'SPIRAL',           // 180-240
  ELLIPTICAL: 'ELLIPTICAL',   // 240-300
  DISTORTED: 'DISTORTED'      // 300-360
} as const;

export type GalaxyType = typeof GalaxyType[keyof typeof GalaxyType];

export function getGalaxyTypeFromHue(hue: number): GalaxyType {
  const hDeg = hue * 360;
  if (hDeg < 60) return GalaxyType.NEBULA;
  if (hDeg < 120) return GalaxyType.STARBURST;
  if (hDeg < 180) return GalaxyType.CLUSTER;
  if (hDeg < 240) return GalaxyType.SPIRAL;
  if (hDeg < 300) return GalaxyType.ELLIPTICAL;
  return GalaxyType.DISTORTED;
}
