import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { COLORS, FONT } from "@/src/theme";

export function TitleText(p: TextProps) {
  return <Text {...p} style={[styles.title, p.style]} />;
}
export function MonoText(p: TextProps) {
  return <Text {...p} style={[styles.mono, p.style]} />;
}
export function MutedText(p: TextProps) {
  return <Text {...p} style={[styles.muted, p.style]} />;
}
export function NeonLabel({ color = COLORS.cyan, ...p }: TextProps & { color?: string }) {
  return <Text {...p} style={[styles.neonLabel, { color }, p.style]} />;
}

const styles = StyleSheet.create({
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: FONT.heading,
    letterSpacing: -0.5,
    fontWeight: "900",
  },
  mono: { color: COLORS.textPrimary, fontFamily: FONT.body, fontSize: 14, lineHeight: 22 },
  muted: { color: COLORS.textSecondary, fontFamily: FONT.body, fontSize: 13, lineHeight: 20 },
  neonLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
});
