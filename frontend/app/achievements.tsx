import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

export default function Achievements() {
  const router = useRouter();
  const [achs, setAchs] = useState<any[]>([]);

  useEffect(() => {
    (async () => { try { setAchs(await api.get<any[]>("/achievements")); } catch { /* noop */ } })();
  }, []);

  const unlocked = achs.filter(a => a.unlocked).length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}><MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText></Pressable>
      <NeonLabel color={COLORS.amber}>{"// achievements.log"}</NeonLabel>
      <TitleText style={styles.title}>HALL OF{"\n"}LEGENDS</TitleText>
      <MutedText style={{ marginBottom: 16, marginTop: 6 }}>
        {unlocked} / {achs.length} achievements forged.
      </MutedText>

      {achs.map((a) => (
        <View
          key={a.id}
          testID={`achievement-${a.id}`}
          style={[
            styles.card,
            {
              borderColor: a.unlocked ? COLORS.amber : "rgba(255,255,255,0.08)",
              shadowColor: a.unlocked ? COLORS.amber : "transparent",
              opacity: a.unlocked ? 1 : 0.55,
            },
          ]}
        >
          <View style={[styles.iconBox, { borderColor: a.unlocked ? COLORS.amber : COLORS.textMuted }]}>
            <Ionicons name={a.icon as any} size={26} color={a.unlocked ? COLORS.amber : COLORS.textMuted} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <MonoText style={{ color: a.unlocked ? COLORS.amber : COLORS.textSecondary, fontSize: 14, fontWeight: "700" }}>
              {a.name}
            </MonoText>
            <MutedText style={{ fontSize: 11, marginTop: 2 }}>{a.description}</MutedText>
            <MonoText style={{ color: COLORS.green, fontSize: 10, marginTop: 4 }}>+{a.xp} XP</MonoText>
          </View>
          {a.unlocked ? <Ionicons name="checkmark-circle" size={20} color={COLORS.amber} /> : <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.amber, fontSize: 28, letterSpacing: 3, lineHeight: 32, fontFamily: FONT.heading, fontWeight: "900" },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, marginBottom: 10, backgroundColor: COLORS.surface, shadowOpacity: 0.3, shadowRadius: 10 },
  iconBox: { width: 56, height: 56, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated },
});
