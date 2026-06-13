import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

const LOCATIONS: Record<string, string> = {
  "nexus-city": "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png",
  "cyber-academy": "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/cc17a5aaaa0d445a9da216aaa998f4e4c78f02d4a43a69aab9324c4f8e4fd389.png",
  "dark-web-market": "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/b1101281f720665e86fdf36b80cf24df3302856e728a30abb92fb21dab613849.png",
};

export default function StoryScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);

  const loadChapters = useCallback(async () => {
    try {
      const c = await api.get<any[]>("/chapters");
      setChapters(c);
      const cur = c.find(x => x.current) || c[0];
      if (cur) {
        setSelected(cur.id);
        const m = await api.get<any[]>(`/chapters/${cur.id}/missions`);
        setMissions(m);
      }
    } catch { /* noop */ }
  }, []);

  const selectChapter = async (id: string) => {
    setSelected(id);
    try {
      const m = await api.get<any[]>(`/chapters/${id}/missions`);
      setMissions(m);
    } catch { /* noop */ }
  };

  useFocusEffect(useCallback(() => { loadChapters(); }, [loadChapters]));

  const curCh = chapters.find(c => c.id === selected);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.purple}>{"// story_archive.dat"}</NeonLabel>
      <TitleText style={styles.title}>STORY ARCHIVE</TitleText>
      <MutedText style={{ marginBottom: 16 }}>Five chapters. One Phantom Grid. Begin where it bleeds.</MutedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {chapters.map((ch) => (
          <Pressable
            key={ch.id}
            testID={`chapter-tab-${ch.id}`}
            onPress={() => ch.unlocked && selectChapter(ch.id)}
            style={[
              styles.chapTab,
              {
                borderColor: selected === ch.id ? COLORS.cyan : ch.unlocked ? "rgba(0,240,255,0.2)" : COLORS.textMuted,
                opacity: ch.unlocked ? 1 : 0.4,
              },
            ]}
          >
            <MonoText style={{ color: selected === ch.id ? COLORS.cyan : COLORS.textSecondary, fontSize: 11 }}>
              CH {ch.number}
            </MonoText>
            {ch.completed ? <Ionicons name="checkmark-circle" size={12} color={COLORS.green} /> : null}
            {!ch.unlocked ? <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} /> : null}
          </Pressable>
        ))}
      </ScrollView>

      {curCh ? (
        <View style={styles.chHero}>
          {LOCATIONS[curCh.location] ? (
            <Image source={{ uri: LOCATIONS[curCh.location] }} style={styles.chBg} resizeMode="cover" />
          ) : null}
          <View style={styles.chOverlay} />
          <View style={{ padding: 18 }}>
            <MonoText style={{ color: COLORS.cyan, fontSize: 11 }}>CHAPTER {curCh.number}</MonoText>
            <TitleText style={{ color: COLORS.textPrimary, fontSize: 26, marginTop: 4 }}>{curCh.title}</TitleText>
            <MutedText style={{ marginTop: 8 }}>{curCh.subtitle}</MutedText>
            <MonoText style={{ color: COLORS.textPrimary, fontSize: 12, marginTop: 12, lineHeight: 18 }}>
              {curCh.description}
            </MonoText>
            <MonoText style={{ color: COLORS.red, fontSize: 11, marginTop: 12 }}>
              ⛧ BOSS: {curCh.boss}
            </MonoText>
            {!curCh.unlocked ? (
              <MonoText style={{ color: COLORS.amber, marginTop: 8, fontSize: 11 }}>
                Locked — requires Level {curCh.required_level}
              </MonoText>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <NeonLabel color={COLORS.cyan}>{"// mission_chain"}</NeonLabel>
        {missions.map((m, idx) => (
          <Pressable
            key={m.id}
            testID={`mission-node-${m.id}`}
            disabled={!m.unlocked}
            onPress={() => router.push(`/mission/${m.id}`)}
            style={[
              styles.missionNode,
              {
                borderColor: m.completed ? COLORS.green : m.unlocked ? COLORS.cyan : COLORS.textMuted,
                opacity: m.unlocked ? 1 : 0.5,
              },
            ]}
          >
            <View style={[styles.missionDot, { backgroundColor: m.completed ? COLORS.green : m.unlocked ? COLORS.cyan : COLORS.textMuted }]} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <MonoText style={{ color: m.completed ? COLORS.green : COLORS.textPrimary, fontSize: 14, fontWeight: "700" }}>
                {idx + 1}. {m.title}
              </MonoText>
              <MutedText style={{ fontSize: 11, marginTop: 4 }}>{m.story}</MutedText>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                <MonoText style={{ color: COLORS.amber, fontSize: 10 }}>★ {m.difficulty}</MonoText>
                <MonoText style={{ color: COLORS.green, fontSize: 10 }}>+{m.rewards.xp} XP</MonoText>
                {m.combat ? <MonoText style={{ color: COLORS.red, fontSize: 10 }}>⚔ COMBAT</MonoText> : null}
              </View>
            </View>
            <Ionicons
              name={m.completed ? "checkmark-circle" : m.unlocked ? "chevron-forward" : "lock-closed"}
              size={18}
              color={m.completed ? COLORS.green : m.unlocked ? COLORS.cyan : COLORS.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.purple, fontSize: 28, marginTop: 4, marginBottom: 8, letterSpacing: 2, fontFamily: FONT.heading, fontWeight: "900" },
  chapTab: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  chHero: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(157,0,255,0.3)", overflow: "hidden", marginTop: 12 },
  chBg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  chOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,3,5,0.55)" },
  missionNode: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 14,
    marginTop: 10, backgroundColor: COLORS.surface,
  },
  missionDot: { width: 10, height: 10, borderRadius: 0 },
});
