import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";

type Target = { id: string; name: string; faction: string; difficulty: string; story: string; ip: string; domain: string; reward_xp: number; reward_coins: number };

export default function HackLauncher() {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ targets: Target[] }>("/hack/targets");
        setTargets(r.targets);
      } catch { /* noop */ }
    })();
  }, []);

  const launch = async (targetId?: string) => {
    setLoading(true); setError(null);
    try {
      const sess = await api.post<{ id: string }>("/hack/start", { target: targetId });
      router.replace(`/hack/${sess.id}`);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}><MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText></Pressable>
      <NeonLabel color={COLORS.green}>{"// jack_in.exe"}</NeonLabel>
      <TitleText style={styles.title}>HACK BAY</TitleText>
      <MutedText style={{ marginBottom: 16, marginTop: 6 }}>
        Select a target. 4-stage breach: Recon → Exploit → Priv-Esc → Exfil. Terminal commands are live.
      </MutedText>

      {error ? <MonoText style={{ color: COLORS.red, marginBottom: 10 }}>{error}</MonoText> : null}

      {targets.map((t) => {
        const dColor = t.difficulty === "Hard" ? COLORS.red : t.difficulty === "Insane" ? COLORS.purple : COLORS.amber;
        return (
          <Pressable
            key={t.id}
            testID={`hack-target-${t.id}`}
            onPress={() => launch(t.id)}
            disabled={loading}
            style={[styles.card, { borderColor: COLORS.green, shadowColor: COLORS.green }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.icon, { borderColor: COLORS.green }]}>
                <Ionicons name="terminal" size={26} color={COLORS.green} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <MonoText style={{ color: COLORS.green, fontSize: 15, fontWeight: "700" }}>{t.name}</MonoText>
                <MutedText style={{ fontSize: 11, marginTop: 2 }}>{t.faction} · {t.domain}</MutedText>
              </View>
              <View style={[styles.diffPill, { borderColor: dColor }]}>
                <MonoText style={{ color: dColor, fontSize: 10, letterSpacing: 1.5 }}>{t.difficulty.toUpperCase()}</MonoText>
              </View>
            </View>
            <MutedText style={{ marginTop: 10, fontSize: 12, lineHeight: 18 }}>{t.story}</MutedText>
            <View style={styles.rewardRow}>
              <MonoText style={{ color: COLORS.green, fontSize: 11 }}>+{t.reward_xp} XP</MonoText>
              <MonoText style={{ color: COLORS.cyan, fontSize: 11 }}>+{t.reward_coins} CR</MonoText>
              <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>{t.ip}</MonoText>
            </View>
          </Pressable>
        );
      })}

      <View style={{ marginTop: 14 }}>
        <NeonButton testID="random-hack" label={loading ? "Connecting..." : "Random Target"} onPress={() => launch()} loading={loading} color={COLORS.cyan} variant="outline" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.green, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  card: { borderWidth: 1, padding: 14, marginBottom: 12, backgroundColor: COLORS.surface, shadowOpacity: 0.35, shadowRadius: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  icon: { width: 50, height: 50, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated },
  diffPill: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  rewardRow: { flexDirection: "row", gap: 14, marginTop: 10 },
});
