import React from "react";
import { StyleSheet, Text, TextInput, View, TextInputProps } from "react-native";
import { COLORS, FONT } from "@/src/theme";

interface CyberInputProps extends TextInputProps {
  label?: string;
  error?: string;
  testID?: string;
}

export function CyberInput({ label, error, style, testID, ...rest }: CyberInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        testID={testID}
        placeholderTextColor={COLORS.textMuted}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        style={[
          styles.input,
          { borderBottomColor: error ? COLORS.red : focused ? COLORS.cyan : "rgba(0,240,255,0.3)" },
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    color: COLORS.cyan,
    fontSize: 11,
    fontFamily: FONT.bodyBold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: "700",
  },
  input: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontFamily: FONT.body,
    fontSize: 15,
  },
  error: { color: COLORS.red, fontSize: 11, marginTop: 4, fontFamily: FONT.body },
});
