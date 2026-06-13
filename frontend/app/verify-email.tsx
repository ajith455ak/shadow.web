import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async () => {
    setErr(null);
    setSuccess(null);
    if (!email || !token) {
      setErr("Both email and token are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email: email.trim(), token: token.trim() });
      setSuccess("Account verified successfully! Returning to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (e: any) {
      setErr(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErr(null);
    setSuccess(null);
    if (!email) {
      setErr("Please enter your email address to resend OTP code");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<any>("/auth/resend-verification", { email: email.trim() });
      setSuccess(`Verification OTP code resent! ${res.verification_token_demo ? "(Demo: " + res.verification_token_demo + ")" : ""}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to resend OTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <NeonLabel color={COLORS.purple}>{"// verify_identity.init"}</NeonLabel>
          <TitleText style={styles.title}>VERIFICATION{"\n"}REQUIRED</TitleText>
          <MutedText style={{ marginVertical: 12 }}>
            Complete the security verification process to gain grid access.
          </MutedText>

          <View style={styles.form}>
            <CyberInput
              testID="verify-email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="agent@nexus.io"
            />
            <CyberInput
              testID="verify-token-input"
              label="Verification OTP Code"
              value={token}
              onChangeText={setToken}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              placeholder="Enter 6-digit OTP"
            />

            {err ? <MonoText style={{ color: COLORS.red, marginBottom: 12, fontSize: 12 }}>{err}</MonoText> : null}
            {success ? <MonoText style={{ color: COLORS.green, marginBottom: 12, fontSize: 12 }}>{success}</MonoText> : null}

            <NeonButton
              testID="verify-submit-button"
              label="Verify Account"
              onPress={handleVerify}
              loading={loading}
              color={COLORS.purple}
              variant="solid"
            />

            <Pressable testID="resend-token-button" onPress={handleResend} style={{ marginTop: 12 }}>
              <MonoText style={{ color: COLORS.cyan, fontSize: 12, textAlign: "center" }}>
                Resend Token
              </MonoText>
            </Pressable>

            <Pressable testID="go-to-login" onPress={() => router.replace("/login")} style={{ marginTop: 18, alignItems: "center" }}>
              <MonoText style={{ color: COLORS.textMuted, fontSize: 12 }}>← Back to Login</MonoText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  title: { fontSize: 34, color: COLORS.purple, marginTop: 4, lineHeight: 38, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 4 },
  form: { backgroundColor: "rgba(10,10,15,0.7)", borderWidth: 1, borderColor: "rgba(157,0,255,0.25)", padding: 24, marginTop: 18 },
});
