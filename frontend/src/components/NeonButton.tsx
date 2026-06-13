import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { COLORS, FONT, RADII } from "@/src/theme";

interface NeonButtonProps {
  label: string;
  onPress?: () => void;
  color?: string;
  variant?: "solid" | "outline";
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  small?: boolean;
}

export function NeonButton({
  label, onPress, color = COLORS.cyan, variant = "outline",
  disabled, loading, testID, small,
}: NeonButtonProps) {
  const isSolid = variant === "solid";
  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        {
          borderColor: color,
          backgroundColor: isSolid ? color : "transparent",
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          shadowColor: color,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSolid ? COLORS.bg : color} />
      ) : (
        <Text
          style={[
            styles.label,
            small && styles.labelSmall,
            { color: isSolid ? COLORS.bg : color },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderRadius: RADII.sm,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  small: { paddingVertical: 10, paddingHorizontal: 16 },
  label: {
    fontFamily: FONT.bodyBold,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  labelSmall: { fontSize: 11, letterSpacing: 1.8 },
});
