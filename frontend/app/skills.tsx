import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

const BRANCH_INFO: Record<string, { name: string; color: string; icon: string }> = {
  offensive: { name: "Offensive Security", color: COLORS.red, icon: "flame" },
  defensive: { name: "Defensive Security", color: COLORS.green, icon: "shield" },
  reverse_engineering: { name: "Reverse Engineering", color: COLORS.cyan, icon: "code-slash" },
  forensics: { name: "Digital Forensics", color: COLORS.amber, icon: "search" },
  cryptography: { name: "Cryptography", color: COLORS.purple, icon: "key" },
};

export default function SkillsScreen() {
  const router = useRouter();
  const [data, setData] = useState<{ skills: any[]; skill_points: number }>({ skills: [], skill_points: 0 });

  const load = useCallback(async () => {
    try { setData(await api.get<any>("/skills")); } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unlock = async (id: string) => {
    try { await api.post("/skills/unlock", { skill_id: id }); await load(); } catch { /* noop */ }
  };

  const branches = Array.from(new Set(data.skills.map(s => s.branch)));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}><MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText></Pressable>
      <NeonLabel color={COLORS.green}>{"// skill_matrix.dat"}</NeonLabel>
      <TitleText style={styles.title}>SKILL TREE</TitleText>
      <View style={styles.pointsBox}>
        <Ionicons name="diamond" size={18} color={COLORS.green} />
        <MonoText style={{ color: COLORS.green, marginLeft: 8, fontSize: 14, fontWeight: "700" }}>
          {data.skill_points} SKILL POINTS AVAILABLE
        </MonoText>
      </View>

      {branches.map((b) => {
        const info = BRANCH_INFO[b] || { name: b, color: COLORS.cyan, icon: "git-branch" };
        const branchSkills = data.skills.filter(s => s.branch === b).sort((a, b) => a.tier - b.tier);
        return (
          <View key={b} style={[styles.branchBox, { borderColor: info.color }]}>
            <View style={styles.branchHeader}>
              <Ionicons name={info.icon as any} size={20} color={info.color} />
              <MonoText style={{ color: info.color, marginLeft: 8, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 }}>
                {info.name}
              </MonoText>
            </View>
            <View style={styles.skillsRow}>
              {branchSkills.map((s, i) => (
                <View key={s.id} style={styles.skillNodeWrap}>
                  {i > 0 ? <View style={[styles.link, { backgroundColor: branchSkills[i - 1].unlocked ? info.color : COLORS.textMuted }]} /> : null}
                  <Pressable
                    testID={`skill-${s.id}`}
                    disabled={!s.can_unlock}
                    onPress={() => unlock(s.id)}
                    style={[
                      styles.skillNode,
                      {
                        borderColor: s.unlocked ? info.color : s.can_unlock ? info.color : COLORS.textMuted,
                        backgroundColor: s.unlocked ? `${info.color}25` : COLORS.surface,
                        shadowColor: s.unlocked ? info.color : "transparent",
                        opacity: s.unlocked ? 1 : s.can_unlock ? 0.85 : 0.45,
                      },
                    ]}
                  >
                    <Ionicons name={s.icon as any} size={20} color={info.color} />
                    <MonoText style={{ color: info.color, fontSize: 9, marginTop: 4, textAlign: "center", fontWeight: "700" }}>
                      T{s.tier}
                    </MonoText>
                    {s.unlocked ? <Ionicons name="checkmark-circle" size={10} color={info.color} style={{ position: "absolute", top: 4, right: 4 }} /> : null}
                  </Pressable>
                </View>
              ))}
            </View>
            <View>
              {branchSkills.map(s => (
                <View key={`d-${s.id}`} style={styles.skillDetail}>
                  <MonoText style={{ color: s.unlocked ? info.color : COLORS.textPrimary, fontSize: 12, fontWeight: "700" }}>
                    {s.name}
                  </MonoText>
                  <MutedText style={{ fontSize: 11, marginTop: 2 }}>{s.description}</MutedText>
                  <MonoText style={{ fontSize: 10, color: COLORS.amber, marginTop: 4 }}>
                    {s.unlocked ? "✓ UNLOCKED" : `Cost: ${s.cost} SP`}
                  </MonoText>
                </View>
              ))}
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
  title: { color: COLORS.green, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  pointsBox: { flexDirection: "row", alignItems: "center", marginVertical: 16, padding: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,255,65,0.3)" },
  branchBox: { borderWidth: 1, padding: 14, marginBottom: 14, backgroundColor: COLORS.surface },
  branchHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  skillsRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  skillNodeWrap: { flexDirection: "row", alignItems: "center" },
  link: { width: 24, height: 2 },
  skillNode: { width: 58, height: 58, borderWidth: 2, alignItems: "center", justifyContent: "center", shadowOpacity: 0.7, shadowRadius: 8 },
  skillDetail: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
});
