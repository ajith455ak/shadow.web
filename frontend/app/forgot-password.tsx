import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const submit = async () => {
    setMsg(null);
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post<{ message: string; reset_token_demo?: string }>("/auth/forgot-password", { email: email.trim() });
      setMsg(res.message);
      if (res.reset_token_demo) setDemoToken(res.reset_token_demo);
    } catch (e: any) {
      setMsg(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <NeonLabel color={COLORS.amber}>{"// recovery_protocol"}</NeonLabel>
        <TitleText style={styles.title}>FORGOT{"\n"}ACCESS?</TitleText>
        <MutedText style={{ marginVertical: 12 }}>
          Enter your email. A reset link will be transmitted via secure channel.
        </MutedText>

        <View style={styles.form}>
          <CyberInput
            testID="forgot-email-input"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="agent@nexus.io"
          />
          {msg ? <MonoText style={{ color: COLORS.green, marginBottom: 8, fontSize: 12 }}>{msg}</MonoText> : null}
          {demoToken ? (
            <View style={styles.demoBox}>
              <NeonLabel color={COLORS.amber}>DEMO RESET TOKEN</NeonLabel>
              <MonoText style={{ color: COLORS.textPrimary, marginTop: 6, fontSize: 11 }}>{demoToken}</MonoText>
            </View>
          ) : null}
          <NeonButton testID="forgot-submit-button" label="Transmit" onPress={submit} loading={loading} color={COLORS.amber} variant="solid" />
          <Link href="/login" asChild>
            <Pressable testID="back-to-login" style={{ marginTop: 18, alignItems: "center" }}>
              <MonoText style={{ color: COLORS.cyan, fontSize: 12 }}>← Back to Login</MonoText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  title: { fontSize: 38, color: COLORS.amber, marginTop: 4, lineHeight: 42, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 4 },
  form: { backgroundColor: "rgba(10,10,15,0.7)", borderWidth: 1, borderColor: "rgba(255,176,0,0.25)", padding: 24, marginTop: 18 },
  demoBox: { backgroundColor: COLORS.surfaceElevated, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,176,0,0.3)" },
});
