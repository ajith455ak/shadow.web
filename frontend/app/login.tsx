import { useState } from "react";
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Switch, View,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

const BG = "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    if (!email || !password) { setErr("Enter your credentials"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: BG }} style={styles.bg} resizeMode="cover" />
      <View style={styles.overlay} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <NeonLabel color={COLORS.cyan}>{"// shadow_nexus.exe"}</NeonLabel>
            <TitleText style={styles.title}>SHADOW{"\n"}NEXUS</TitleText>
            <MutedText style={{ marginTop: 4 }}>
              The Phantom Grid is awakening. Jack in, Agent.
            </MutedText>
          </View>

          <View style={styles.form}>
            <CyberInput
              testID="login-email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="agent@nexus.io"
            />
            <CyberInput
              testID="login-password-input"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <View style={styles.row}>
              <Pressable
                testID="login-remember-toggle"
                onPress={() => setRemember(!remember)}
                style={styles.rememberRow}
              >
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  trackColor={{ false: COLORS.surfaceElevated, true: COLORS.cyan }}
                  thumbColor={COLORS.bg}
                />
                <MonoText style={{ marginLeft: 10, color: COLORS.textSecondary, fontSize: 12 }}>
                  Remember me
                </MonoText>
              </Pressable>
              <Link href="/forgot-password" asChild>
                <Pressable testID="forgot-password-link">
                  <MonoText style={{ color: COLORS.purple, fontSize: 12 }}>Forgot?</MonoText>
                </Pressable>
              </Link>
            </View>

            {err ? (
              <View style={{ marginBottom: 12 }}>
                <MonoText style={{ color: COLORS.red, fontSize: 12 }}>{err}</MonoText>
                {err.includes("verify your email") ? (
                  <Link href={{ pathname: "/verify-email", params: { email: email.trim() } }} asChild>
                    <Pressable testID="go-to-verify-email" style={{ marginTop: 6 }}>
                      <MonoText style={{ color: COLORS.cyan, fontSize: 12, textDecorationLine: "underline" }}>
                        Go to verification page &rarr;
                      </MonoText>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
            ) : null}

            <NeonButton
              testID="login-submit-button"
              label="Jack In"
              onPress={onSubmit}
              loading={loading}
              color={COLORS.cyan}
              variant="solid"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MonoText style={{ color: COLORS.textMuted, marginHorizontal: 12, fontSize: 11 }}>OR</MonoText>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/register" asChild>
              <Pressable testID="go-to-register">
                <View style={styles.altBtn}>
                  <Ionicons name="person-add-outline" size={16} color={COLORS.purple} />
                  <MonoText style={{ color: COLORS.purple, marginLeft: 8 }}>
                    Create new operative
                  </MonoText>
                </View>
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
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,3,5,0.75)" },
  scroll: { padding: 24, paddingTop: 80, paddingBottom: 60, flexGrow: 1, justifyContent: "center" },
  brandBlock: { marginBottom: 40 },
  title: { fontSize: 44, color: COLORS.cyan, marginTop: 8, lineHeight: 46, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 4 },
  form: {
    backgroundColor: "rgba(10,10,15,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.2)",
    padding: 24,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(0,240,255,0.15)" },
  altBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
});
