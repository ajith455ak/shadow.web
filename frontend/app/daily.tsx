import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

export default function DailyChallenges() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);

  const load = useCallback(async () => {
    try { setList(await api.get<any[]>("/daily-challenges")); } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}><MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText></Pressable>
      <NeonLabel color={COLORS.amber}>{"// daily_directives"}</NeonLabel>
      <TitleText style={styles.title}>DAILY OPS</TitleText>
      <MutedText style={{ marginBottom: 18, marginTop: 6 }}>Reset every 24 hours. Stack rewards while the grid sleeps.</MutedText>

      {list.map((c) => (
        <View key={c.id} style={[styles.card, c.completed && { borderColor: COLORS.green, shadowColor: COLORS.green }]}>
          <View style={styles.cardTop}>
            <Ionicons name={c.completed ? "checkmark-circle" : "time"} size={22} color={c.completed ? COLORS.green : COLORS.amber} />
            <MonoText style={{ color: c.completed ? COLORS.green : COLORS.amber, marginLeft: 8, fontSize: 14, fontWeight: "700", flex: 1 }}>
              {c.name}
            </MonoText>
            <MonoText style={{ color: c.completed ? COLORS.green : COLORS.textSecondary, fontSize: 11 }}>
              {c.completed ? "DONE" : `${c.progress}/${c.target}`}
            </MonoText>
          </View>
          <MutedText style={{ marginTop: 8, fontSize: 12 }}>{c.description}</MutedText>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, (c.progress / c.target) * 100)}%`, backgroundColor: c.completed ? COLORS.green : COLORS.amber }]} />
          </View>
          <View style={styles.rewardRow}>
            {c.rewards.coins ? <MonoText style={{ color: COLORS.cyan, fontSize: 11 }}>+{c.rewards.coins} CR</MonoText> : null}
            {c.rewards.xp ? <MonoText style={{ color: COLORS.green, fontSize: 11 }}>+{c.rewards.xp} XP</MonoText> : null}
            {c.rewards.items?.length ? <MonoText style={{ color: COLORS.purple, fontSize: 11 }}>+{c.rewards.items.length} item</MonoText> : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.amber, fontSize: 28, letterSpacing: 3, fontFamily: FONT.heading, fontWeight: "900" },
  card: { padding: 14, borderWidth: 1, borderColor: "rgba(255,176,0,0.3)", marginBottom: 10, backgroundColor: COLORS.surface, shadowOpacity: 0.3, shadowRadius: 10 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  barBg: { height: 6, backgroundColor: COLORS.surfaceElevated, marginTop: 10 },
  barFill: { height: 6 },
  rewardRow: { flexDirection: "row", gap: 14, marginTop: 8 },
});
