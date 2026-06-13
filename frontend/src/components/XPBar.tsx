import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONT } from "@/src/theme";

interface XPBarProps {
  progress: number; // 0..1
  level: number;
  label?: string;
}

export function XPBar({ progress, level, label }: XPBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.lvl, { color: COLORS.green }]} testID="xp-level">LV {level}</Text>
        <Text style={styles.label}>{label || "EXPERIENCE"}</Text>
        <Text style={styles.pct}>{pct.toFixed(0)}%</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} testID="xp-bar" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  lvl: { fontFamily: FONT.bodyBold, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  label: { color: COLORS.textMuted, fontFamily: FONT.body, fontSize: 10, letterSpacing: 2 },
  pct: { color: COLORS.green, fontFamily: FONT.body, fontSize: 11 },
  barBg: { height: 8, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: "rgba(0,255,65,0.2)" },
  barFill: { height: "100%", backgroundColor: COLORS.green, shadowColor: COLORS.green, shadowOpacity: 0.8, shadowRadius: 4 },
});
