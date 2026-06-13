import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

function RequirementMet({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={14}
        color={met ? COLORS.green : COLORS.textMuted}
      />
      <MonoText style={{ fontSize: 11, marginLeft: 6, color: met ? COLORS.textPrimary : COLORS.textMuted }}>
        {text}
      </MonoText>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [confirm, setC] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()\-=_+[\]{}|;:',.<>?/~`]/.test(password);

  const submit = async () => {
    setErr(null);
    if (!username || !email || !password) { setErr("All fields are required"); return; }
    if (username.length < 3) { setErr("Username must be at least 3 chars"); return; }
    if (!hasMinLen) { setErr("Password must be at least 8 characters"); return; }
    if (!hasUpper) { setErr("Password must contain at least one uppercase letter"); return; }
    if (!hasLower) { setErr("Password must contain at least one lowercase letter"); return; }
    if (!hasDigit) { setErr("Password must contain at least one digit"); return; }
    if (!hasSpecial) { setErr("Password must contain at least one special character"); return; }
    if (password !== confirm) { setErr("Passwords don't match"); return; }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      router.replace({ pathname: "/verify-email", params: { email: email.trim() } });
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <NeonLabel color={COLORS.purple}>{"// new_operative.init"}</NeonLabel>
          <TitleText style={styles.title}>RECRUIT{"\n"}PROTOCOL</TitleText>
          <MutedText style={{ marginVertical: 12 }}>
            Initialize your operative profile. The grid is waiting.
          </MutedText>

          <View style={styles.form}>
            <CyberInput testID="register-username-input" label="Username (codename)" value={username} onChangeText={setU} autoCapitalize="none" placeholder="ghost_07" />
            <CyberInput testID="register-email-input" label="Email" value={email} onChangeText={setE} keyboardType="email-address" autoCapitalize="none" placeholder="agent@nexus.io" />
            <CyberInput testID="register-password-input" label="Password" value={password} onChangeText={setP} secureTextEntry placeholder="At least 8 characters" />
            
            <View style={{ marginVertical: 8, paddingHorizontal: 4 }}>
              <RequirementMet met={hasMinLen} text="At least 8 characters" />
              <RequirementMet met={hasUpper} text="At least one uppercase letter" />
              <RequirementMet met={hasLower} text="At least one lowercase letter" />
              <RequirementMet met={hasDigit} text="At least one digit" />
              <RequirementMet met={hasSpecial} text="At least one special character" />
            </View>

            <CyberInput testID="register-confirm-input" label="Confirm Password" value={confirm} onChangeText={setC} secureTextEntry placeholder="Repeat password" />

            {err ? <MonoText style={{ color: COLORS.red, marginBottom: 12, fontSize: 12 }}>{err}</MonoText> : null}

            <NeonButton testID="register-submit-button" label="Initialize" onPress={submit} loading={loading} color={COLORS.purple} variant="solid" />

            <Link href="/login" asChild>
              <Pressable testID="go-to-login" style={{ marginTop: 18, alignItems: "center" }}>
                <MonoText style={{ color: COLORS.cyan, fontSize: 12 }}>← Back to Login</MonoText>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  title: { fontSize: 38, color: COLORS.purple, marginTop: 4, lineHeight: 42, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 4 },
  form: { backgroundColor: "rgba(10,10,15,0.7)", borderWidth: 1, borderColor: "rgba(157,0,255,0.25)", padding: 24, marginTop: 18 },
});
