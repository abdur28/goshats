export const COLORS = {
  primary: "#006B3F",
  primaryLight: "#33A877",
  primaryDark: "#004026",
  accent: "#DAA520",
  accentLight: "#EFCF73",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",

  white: "#FFFFFF",
  black: "#000000",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  border: "#E9ECEF",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  placeholder: "#D1D5DB",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
