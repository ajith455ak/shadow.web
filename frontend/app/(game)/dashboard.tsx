import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { XPBar } from "@/src/components/XPBar";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get<any>("/dashboard");
      setData(d);
    } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!data) {
    return <View style={styles.root}><MutedText style={{ padding: 24 }}>Booting HUD...</MutedText></View>;
  }
  const c = data.character;
  const av = AVATAR_MAP[c.avatar_id] || { icon: "person", color: COLORS.cyan };
  const cl = CLASS_MAP[c.cyber_class] || { name: "Operative", color: COLORS.cyan, icon: "shield" };
  const cm = data.current_mission;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.cyan} />}
    >
      <Image source={{ uri: HERO_BG }} style={styles.heroBg} resizeMode="cover" />
      <View style={styles.heroOverlay} />

      <View style={styles.header}>
        <View>
          <NeonLabel color={COLORS.cyan}>{"// nexus_hq.online"}</NeonLabel>
          <TitleText style={styles.title}>{c.name.toUpperCase()}</TitleText>
          <MonoText style={{ color: cl.color, fontSize: 11, marginTop: 2 }}>
            {cl.name.toUpperCase()} · REP {c.reputation}
          </MonoText>
        </View>
        <View style={[styles.avatarFrame, { borderColor: av.color, shadowColor: av.color }]}>
          <Ionicons name={av.icon as any} size={42} color={av.color} />
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <NeonLabel color={COLORS.amber}>COINS</NeonLabel>
          <MonoText testID="dashboard-coins" style={styles.bigStat}>{c.coins}</MonoText>
        </View>
        <View style={styles.statBox}>
          <NeonLabel color={COLORS.purple}>LEVEL</NeonLabel>
          <MonoText style={styles.bigStat}>{c.level}</MonoText>
        </View>
        <View style={styles.statBox}>
          <NeonLabel color={COLORS.green}>REP</NeonLabel>
          <MonoText style={styles.bigStat}>{c.reputation}</MonoText>
        </View>
      </View>

      <View style={styles.xpPanel}>
        <XPBar progress={data.xp_progress} level={c.level} label={`${data.xp_to_next_level} XP TO NEXT`} />
      </View>

      {cm ? (
        <View style={styles.missionCard} testID="active-mission-card">
          <NeonLabel color={COLORS.cyan}>ACTIVE MISSION</NeonLabel>
          <TitleText style={{ fontSize: 22, color: COLORS.textPrimary, marginTop: 8 }}>{cm.title}</TitleText>
          <MutedText style={{ marginTop: 6 }}>{cm.story}</MutedText>
          <View style={styles.missionMeta}>
            <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>★ {cm.difficulty}</MonoText>
            <MonoText style={{ color: COLORS.green, fontSize: 11 }}>+{cm.rewards.xp} XP</MonoText>
            <MonoText style={{ color: COLORS.purple, fontSize: 11 }}>+{cm.rewards.coins} CR</MonoText>
          </View>
          <View style={{ marginTop: 14 }}>
            <NeonButton
              testID="start-active-mission"
              label="Engage Mission"
              onPress={() => router.push(`/mission/${cm.id}`)}
              color={COLORS.cyan}
              variant="solid"
            />
          </View>
        </View>
      ) : (
        <View style={styles.missionCard}>
          <MutedText>All chapter missions complete. Proceed to the next story arc.</MutedText>
        </View>
      )}

      <View style={styles.quickGrid}>
        <Pressable testID="quick-hack" style={styles.quickBtn} onPress={() => router.push("/hack-bay")}>
          <Ionicons name="terminal" size={22} color={COLORS.green} />
          <MonoText style={styles.quickLabel}>Hack</MonoText>
        </Pressable>
        <Pressable testID="quick-messenger" style={styles.quickBtn} onPress={() => router.push("/messenger")}>
          <Ionicons name="mail" size={22} color={COLORS.green} />
          <MonoText style={styles.quickLabel}>Inbox</MonoText>
        </Pressable>
        <Pressable testID="quick-story" style={styles.quickBtn} onPress={() => router.push("/story")}>
          <Ionicons name="git-network" size={22} color={COLORS.cyan} />
          <MonoText style={styles.quickLabel}>Story</MonoText>
        </Pressable>
        <Pressable testID="quick-daily" style={styles.quickBtn} onPress={() => router.push("/daily")}>
          <Ionicons name="calendar" size={22} color={COLORS.amber} />
          <MonoText style={styles.quickLabel}>Daily</MonoText>
        </Pressable>
        <Pressable testID="quick-skills" style={styles.quickBtn} onPress={() => router.push("/skills")}>
          <Ionicons name="git-branch" size={22} color={COLORS.green} />
          <MonoText style={styles.quickLabel}>Skills</MonoText>
        </Pressable>
        <Pressable testID="quick-achievements" style={styles.quickBtn} onPress={() => router.push("/achievements")}>
          <Ionicons name="trophy" size={22} color={COLORS.purple} />
          <MonoText style={styles.quickLabel}>Awards</MonoText>
        </Pressable>
        <Pressable testID="quick-leaderboard" style={styles.quickBtn} onPress={() => router.push("/leaderboard")}>
          <Ionicons name="podium" size={22} color={COLORS.red} />
          <MonoText style={styles.quickLabel}>Ranks</MonoText>
        </Pressable>
        <Pressable testID="quick-inventory" style={styles.quickBtn} onPress={() => router.push("/inventory")}>
          <Ionicons name="cube" size={22} color={COLORS.cyan} />
          <MonoText style={styles.quickLabel}>Gear</MonoText>
        </Pressable>
      </View>

      <View style={styles.dailyCard}>
        <NeonLabel color={COLORS.amber}>DAILY CHALLENGES</NeonLabel>
        {data.daily_challenges.map((dc: any) => (
          <View key={dc.id} style={styles.dailyRow}>
            <View style={{ flex: 1 }}>
              <MonoText style={{ color: COLORS.textPrimary, fontSize: 13 }}>{dc.name}</MonoText>
              <MutedText style={{ fontSize: 11 }}>{dc.description}</MutedText>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${Math.min(100, (dc.progress / dc.target) * 100)}%`, backgroundColor: dc.completed ? COLORS.green : COLORS.amber }]} />
              </View>
            </View>
            <MonoText style={{ color: dc.completed ? COLORS.green : COLORS.amber, fontSize: 11, marginLeft: 8 }}>
              {dc.completed ? "✓" : `${dc.progress}/${dc.target}`}
            </MonoText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,3,5,0.85)" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 14 },
  title: { color: COLORS.cyan, fontSize: 26, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  avatarFrame: {
    width: 70, height: 70, borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.surface, shadowOpacity: 0.7, shadowRadius: 12,
  },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,240,255,0.15)", padding: 12 },
  bigStat: { color: COLORS.textPrimary, fontSize: 22, marginTop: 4, fontFamily: FONT.bodyBold, fontWeight: "700" },
  xpPanel: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,255,65,0.2)", padding: 14, marginBottom: 14 },
  missionCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,240,255,0.3)", padding: 18, marginBottom: 14 },
  missionMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  quickBtn: {
    flexBasis: "31%", alignItems: "center", paddingVertical: 16,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  quickLabel: { color: COLORS.textSecondary, fontSize: 10, marginTop: 6, textTransform: "uppercase", letterSpacing: 1.5 },
  dailyCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,176,0,0.25)", padding: 16, marginBottom: 14 },
  dailyRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  miniBarBg: { height: 4, backgroundColor: COLORS.surfaceElevated, marginTop: 6 },
  miniBarFill: { height: 4 },
});
