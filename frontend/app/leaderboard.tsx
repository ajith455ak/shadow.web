import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

export default function Leaderboard() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => { try { setRows(await api.get<any[]>("/leaderboard")); } catch { /* noop */ } })();
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}><MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText></Pressable>
      <NeonLabel color={COLORS.purple}>{"// global_rankings"}</NeonLabel>
      <TitleText style={styles.title}>LEADERBOARD</TitleText>
      <MutedText style={{ marginBottom: 16, marginTop: 6 }}>The elite of the Shadow Nexus.</MutedText>

      {rows.length === 0 ? <MutedText>No rankings yet. Be the first.</MutedText> : null}
      {rows.map((r) => {
        const av = AVATAR_MAP[r.avatar_id] || { icon: "person", color: COLORS.cyan };
        const cl = CLASS_MAP[r.cyber_class] || { name: r.cyber_class, color: COLORS.cyan, icon: "shield" };
        const isTop3 = r.rank <= 3;
        const medalColor = r.rank === 1 ? COLORS.amber : r.rank === 2 ? COLORS.textSecondary : r.rank === 3 ? COLORS.purple : COLORS.textMuted;
        return (
          <View
            key={r.rank}
            testID={`leaderboard-row-${r.rank}`}
            style={[
              styles.row,
              isTop3 && { borderColor: medalColor, shadowColor: medalColor, shadowOpacity: 0.5 },
            ]}
          >
            <View style={[styles.rankBox, { borderColor: medalColor }]}>
              <MonoText style={{ color: medalColor, fontSize: 16, fontWeight: "700" }}>#{r.rank}</MonoText>
            </View>
            <View style={[styles.av, { borderColor: av.color }]}>
              <Ionicons name={av.icon as any} size={22} color={av.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <MonoText style={{ color: av.color, fontSize: 13, fontWeight: "700" }}>{r.name}</MonoText>
              <MutedText style={{ fontSize: 10 }}>{cl.name}</MutedText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <MonoText style={{ color: COLORS.green, fontSize: 12 }}>LV {r.level}</MonoText>
              <MonoText style={{ color: COLORS.amber, fontSize: 10 }}>{r.total_xp} XP</MonoText>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.purple, fontSize: 28, letterSpacing: 3, fontFamily: FONT.heading, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 8, backgroundColor: COLORS.surface, shadowRadius: 12 },
  rankBox: { width: 44, height: 44, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated },
  av: { width: 44, height: 44, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginLeft: 10, backgroundColor: COLORS.surfaceElevated },
});
