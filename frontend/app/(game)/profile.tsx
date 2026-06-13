import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

export default function Profile() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [char, setChar] = useState<any>(null);

  const load = useCallback(async () => {
    try { setChar(await api.get<any>("/character")); } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!char) return <View style={styles.root}><MutedText style={{ padding: 24 }}>Loading...</MutedText></View>;
  const av = AVATAR_MAP[char.avatar_id] || { icon: "person", color: COLORS.cyan };
  const cl = CLASS_MAP[char.cyber_class] || { name: "Operative", color: COLORS.cyan, icon: "shield" };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.cyan}>{"// profile.sys"}</NeonLabel>
      <TitleText style={styles.title}>OPERATIVE</TitleText>

      <View style={[styles.heroCard, { borderColor: av.color, shadowColor: av.color }]}>
        <View style={[styles.avatar, { borderColor: av.color, shadowColor: av.color }]}>
          <Ionicons name={av.icon as any} size={62} color={av.color} />
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <TitleText style={{ fontSize: 22, color: av.color }}>{char.name}</TitleText>
          <MonoText style={{ color: cl.color, fontSize: 12, marginTop: 2 }}>{cl.name.toUpperCase()}</MonoText>
          <MonoText style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 6 }}>@{user?.username}</MonoText>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
            <MonoText style={{ color: COLORS.green, fontSize: 12 }}>LV {char.level}</MonoText>
            <MonoText style={{ color: COLORS.amber, fontSize: 12 }}>{char.coins} ⛒</MonoText>
            <MonoText style={{ color: COLORS.purple, fontSize: 12 }}>REP {char.reputation}</MonoText>
          </View>
        </View>
      </View>

      <NeonLabel color={COLORS.cyan} style={{ marginTop: 20 }}>{"// stats"}</NeonLabel>
      <View style={styles.statsBox}>
        {Object.entries(char.stats).map(([k, v]) => (
          <View key={k} style={styles.statRow}>
            <MonoText style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", width: 130 }}>
              {k.replace("_", " ")}
            </MonoText>
            <View style={styles.statBarBg}>
              <View style={[styles.statBarFill, { width: `${Math.min(100, (v as number) * 5)}%` }]} />
            </View>
            <MonoText style={{ color: COLORS.cyan, fontSize: 11, width: 30, textAlign: "right" }}>{String(v)}</MonoText>
          </View>
        ))}
      </View>

      <View style={styles.actionGrid}>
        <Pressable style={styles.actionBtn} onPress={() => router.push("/skills")}>
          <Ionicons name="git-branch" size={22} color={COLORS.green} />
          <MonoText style={styles.actionLabel}>Skill Tree</MonoText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push("/achievements")}>
          <Ionicons name="trophy" size={22} color={COLORS.amber} />
          <MonoText style={styles.actionLabel}>Achievements</MonoText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push("/leaderboard")}>
          <Ionicons name="podium" size={22} color={COLORS.purple} />
          <MonoText style={styles.actionLabel}>Leaderboard</MonoText>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <NeonButton
          testID="logout-button"
          label="Disconnect"
          color={COLORS.red}
          variant="outline"
          onPress={async () => { await logout(); router.replace("/login"); }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.cyan, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  heroCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 16, marginTop: 12, backgroundColor: COLORS.surface, shadowOpacity: 0.4, shadowRadius: 14 },
  avatar: { width: 100, height: 100, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated, shadowOpacity: 0.7, shadowRadius: 14 },
  statsBox: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,240,255,0.15)", padding: 16, marginTop: 8 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statBarBg: { flex: 1, height: 6, backgroundColor: COLORS.surfaceElevated, marginHorizontal: 8 },
  statBarFill: { height: 6, backgroundColor: COLORS.cyan },
  actionGrid: { flexDirection: "row", gap: 8, marginTop: 18 },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  actionLabel: { color: COLORS.textSecondary, fontSize: 10, marginTop: 6, textTransform: "uppercase" },
});
