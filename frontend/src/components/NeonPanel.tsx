import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { COLORS, RADII } from "@/src/theme";

interface NeonPanelProps extends ViewProps {
  glow?: string; // glow color
  border?: string;
}

export function NeonPanel({ glow = COLORS.cyan, border, style, children, ...rest }: NeonPanelProps) {
  return (
    <View
      {...rest}
      style={[
        styles.panel,
        {
          borderColor: border ?? `${glow}55`,
          shadowColor: glow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: RADII.sm,
    padding: 16,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
