import { Platform } from "react-native";

/**
 * Shadow Nexus — design tokens.
 * Cyberpunk dark base + neon accents.
 */
export const COLORS = {
  bg: "#030305",
  surface: "#0A0A0F",
  surfaceElevated: "#12121A",
  surfaceGlass: "rgba(10,10,15,0.7)",
  border: "rgba(0, 240, 255, 0.15)",
  borderActive: "rgba(0, 240, 255, 0.5)",
  borderPurple: "rgba(157, 0, 255, 0.35)",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  cyan: "#00F0FF",
  green: "#00FF41",
  purple: "#9D00FF",
  amber: "#FFB000",
  red: "#FF003C",
  cyanGlow: "rgba(0, 240, 255, 0.4)",
  greenGlow: "rgba(0, 255, 65, 0.4)",
  purpleGlow: "rgba(157, 0, 255, 0.4)",
  redGlow: "rgba(255, 0, 60, 0.4)",
  amberGlow: "rgba(255, 176, 0, 0.4)",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const RADII = { none: 0, sm: 2, md: 4, lg: 8 };

export const SHADOW_NEON = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.7,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
});

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export const FONT = {
  heading: MONO,
  body: MONO,
  bodyBold: MONO,
};
