/**
 * Palette A values for JavaScript consumers.
 * Keep in sync with tokens.css — that file is the source of truth.
 * Timers, canvas, WebGL, BorderGlow, and react-hot-toast need real color
 * strings, not var(--token).
 */

export const palette = {
  white: '#ffffff',
  surfaceGround: '#f1f0ec',
  surfaceRaised: '#ffffff',
  borderDefault: '#e0ddd6',
  textPrimary: '#1a1a1a',
  textSecondary: '#6e6a62',
  textFaint: '#a19c92',
  brand50: '#f3f2fd',
  brand150: '#dcd9f8',
  brand200: '#e7e5fb',
  brand300: '#c7c3f8',
  accentLight: '#8a84f0',
  accent: '#5b54e8',
  accentDark: '#4a43c9',
  success: '#2e9d6a',
  danger: '#dc4a3f',
  warning: '#e8862a',
};

/** "H S L" triplet (no percent signs) for BorderGlow. */
export function hexToHslString(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)} ${Math.round(l * 100)}`;
}

/** { r, g, b } in 0–255. */
export function hexToRgb(hex) {
  let v = hex.replace('#', '');
  if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** [r, g, b] in 0–1 for shader vec3 literals. */
export function hexToVec3(hex) {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

/** BorderGlow defaults (N10). Homepage call sites pass their own colors. */
export const borderGlowDefaults = {
  glowColor: hexToHslString(palette.accent),
  colors: [palette.brand300, palette.accentLight, palette.accent],
};

/** HoverBorderGlow defaults (N10). Homepage call sites pass their own colors. */
export const hoverBorderGlowDefaults = {
  colors: [palette.white, palette.accentLight, palette.accentDark],
};

/**
 * One social-icon color map. Brand colors stay; email and website use accent.
 * Wired into post-event auth, paired-player history, the attendees-history
 * tutorial, the organizer dashboard, and the match-history tutorial.
 */
export const socialIconColors = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  phone: '#25D366',
  whatsapp: '#25D366',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  snapchat: '#F7D600',
  email: palette.accent,
  website: palette.accent,
};

export function getSocialIconColor(platform) {
  return socialIconColors[platform] || socialIconColors.website;
}

/**
 * Softer 12-tone tag set (N9). Same hash as the dashboard picker.
 * White text is under 4.5:1 on every wash, so text is text-primary.
 * Wired into the organizer dashboard tag pills.
 */
export const tagPalette = [
  { id: 'indigo', background: '#908bd0', text: palette.textPrimary },
  { id: 'violet', background: '#a48bd0', text: palette.textPrimary },
  { id: 'purple', background: '#c08bd0', text: palette.textPrimary },
  { id: 'magenta', background: '#d08bb7', text: palette.textPrimary },
  { id: 'rose', background: '#d08b99', text: palette.textPrimary },
  { id: 'coral', background: '#d09d8b', text: palette.textPrimary },
  { id: 'amber', background: '#d0b08b', text: palette.textPrimary },
  { id: 'olive', background: '#b9d08b', text: palette.textPrimary },
  { id: 'sage', background: '#8bd0b0', text: palette.textPrimary },
  { id: 'teal', background: '#8bd0c9', text: palette.textPrimary },
  { id: 'sky', background: '#8bb9d0', text: palette.textPrimary },
  { id: 'periwinkle', background: '#8ba0d0', text: palette.textPrimary },
];

export function getTagTone(tag) {
  if (!tag) return tagPalette[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagPalette[Math.abs(hash) % tagPalette.length];
}

/** Timer ramp for the player lobby, the admin lobby, and the check-in tutorial. */
export const timerColors = [palette.accentLight, palette.accent, palette.accentDark];
export const timerTrail = palette.surfaceGround;

/** react-hot-toast icon and body colors (N7). Body is the toast background. */
export const toastColors = {
  success: palette.success,
  danger: palette.danger,
  body: palette.textPrimary,
};
