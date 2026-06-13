import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

const TAG_LABEL: Record<string, string> = {
  ally: "ALLY",
  mentor: "MENTOR",
  companion: "COMPANION",
  informant: "INFORMANT",
  rival: "RIVAL",
  boss: "ANTAGONIST",
};

export default function NPCList() {
  const router = useRouter();
  const [npcs, setNpcs] = useState<any[]>([]);
  const [trust, setTrust] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const [n, t] = await Promise.all([
        api.get<any[]>("/npcs"),
        api.get<{ trust: Record<string, number> }>("/npcs/trust"),
      ]);
      setNpcs(n);
      setTrust(t.trust || {});
    } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.green}>{"// contacts.encrypted"}</NeonLabel>
      <TitleText style={styles.title}>NETWORK</TitleText>
      <MutedText style={{ marginBottom: 18 }}>Operatives, mentors, rivals, ghosts.</MutedText>

      {npcs.map((n) => {
        const tr = trust[n.id] ?? 0;
        const trCol = tr >= 30 ? COLORS.green : tr <= -30 ? COLORS.red : COLORS.amber;
        return (
          <Pressable
            key={n.id}
            testID={`npc-${n.id}`}
            style={[styles.card, { borderColor: n.color, shadowColor: n.color }]}
            onPress={() => router.push(`/npc/${n.id}`)}
          >
            <View style={[styles.portrait, { borderColor: n.color, shadowColor: n.color }]}>
              {n.portrait ? (
                <Image source={{ uri: n.portrait }} style={styles.portraitImg} />
              ) : (
                <Ionicons name={n.icon as any} size={32} color={n.color} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.headerRow}>
                <MonoText style={{ color: n.color, fontSize: 14, fontWeight: "700", flex: 1 }}>{n.name}</MonoText>
                <View style={[styles.tag, { borderColor: n.hostile ? COLORS.red : n.color }]}>
                  <MonoText style={{ color: n.hostile ? COLORS.red : n.color, fontSize: 8, letterSpacing: 1.5 }}>
                    {TAG_LABEL[n.tag] || "CONTACT"}
                  </MonoText>
                </View>
              </View>
              <MutedText style={{ fontSize: 10, marginTop: 2 }}>{n.role} · {n.faction}</MutedText>
              <View style={styles.trustRow}>
                <MonoText style={{ color: COLORS.textMuted, fontSize: 9 }}>TRUST</MonoText>
                <View style={styles.trustBg}>
                  {/* center axis */}
                  <View style={styles.trustAxis} />
                  <View
                    style={[
                      styles.trustFill,
                      {
                        backgroundColor: trCol,
                        width: `${Math.abs(tr) / 2}%`,
                        left: tr >= 0 ? "50%" : `${50 - Math.abs(tr) / 2}%`,
                      },
                    ]}
                  />
                </View>
                <MonoText style={{ color: trCol, fontSize: 10, width: 36, textAlign: "right" }}>{tr > 0 ? "+" : ""}{tr}</MonoText>
              </View>
            </View>
            <Ionicons name="chatbubbles" size={18} color={n.color} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.green, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  card: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, marginBottom: 10, backgroundColor: COLORS.surface, shadowOpacity: 0.3, shadowRadius: 12 },
  portrait: { width: 60, height: 60, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated, shadowOpacity: 0.6, shadowRadius: 10, overflow: "hidden" },
  portraitImg: { width: 60, height: 60 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, marginLeft: 6 },
  trustRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 },
  trustBg: { flex: 1, height: 5, backgroundColor: COLORS.surfaceElevated, position: "relative", overflow: "hidden" },
  trustAxis: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: COLORS.textMuted },
  trustFill: { position: "absolute", top: 0, bottom: 0 },
});
