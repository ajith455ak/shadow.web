import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

/** Pick the correct puzzle UI based on mission.puzzle. */
type Puzzle = {
  question: string;
  options: { id: string; label: string; correct?: boolean; hint?: string }[];
};

const PUZZLES: Record<string, Puzzle> = {
  port_scan: {
    question: "Which port is COMMONLY associated with the SSH service?",
    options: [
      { id: "21", label: "Port 21 (FTP)" },
      { id: "22", label: "Port 22 (SSH)", correct: true },
      { id: "80", label: "Port 80 (HTTP)" },
      { id: "443", label: "Port 443 (HTTPS)" },
    ],
  },
  sql_injection: {
    question: "Which payload would bypass a simple login WHERE clause?",
    options: [
      { id: "a", label: "username=admin&password=123" },
      { id: "b", label: "admin' OR '1'='1' --", correct: true },
      { id: "c", label: "<script>alert(1)</script>" },
      { id: "d", label: "DROP TABLE users;" },
    ],
  },
  caesar: {
    question: "ROT-3 decryption of 'KHOOR' yields:",
    options: [
      { id: "a", label: "HELLO", correct: true },
      { id: "b", label: "WORLD" },
      { id: "c", label: "PHANTOM" },
      { id: "d", label: "CIPHER" },
    ],
  },
  phishing: {
    question: "Spot the strongest phishing red flag:",
    options: [
      { id: "a", label: "Email from your colleague's known address" },
      { id: "b", label: "Urgent request to wire funds + sender domain off by one char", correct: true },
      { id: "c", label: "Calendar invite for tomorrow" },
      { id: "d", label: "Newsletter you subscribed to" },
    ],
  },
};

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setMission(await api.get<any>(`/missions/${id}`)); }
      catch (e: any) { setError(e?.message); }
    })();
  }, [id]);

  if (error) return <View style={styles.root}><MonoText style={{ color: COLORS.red, padding: 24 }}>{error}</MonoText></View>;
  if (!mission) return <View style={styles.root}><MutedText style={{ padding: 24 }}>Loading mission brief...</MutedText></View>;

  const puzzle = mission.puzzle ? PUZZLES[mission.puzzle] : null;

  const onSubmit = async () => {
    if (mission.combat) {
      router.replace(`/combat/${mission.id}`);
      return;
    }
    if (!puzzle || !selected) return;
    const opt = puzzle.options.find(o => o.id === selected);
    const correct = !!opt?.correct;
    setSubmitting(true);
    try {
      const res = await api.post<any>("/missions/complete", { mission_id: mission.id, won: true, puzzle_correct: correct });
      setResult({ ...res, correct });
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={styles.successBox}>
          <Ionicons name="trophy" size={48} color={COLORS.green} />
          <TitleText style={{ color: COLORS.green, fontSize: 24, marginTop: 12 }}>MISSION COMPLETE</TitleText>
          <MonoText style={{ color: COLORS.amber, marginTop: 16, fontSize: 13 }}>+{result.xp_gained} XP</MonoText>
          <MonoText style={{ color: COLORS.cyan, marginTop: 4, fontSize: 13 }}>+{result.coins_gained} Credits</MonoText>
          {result.items_gained?.length ? (
            <MonoText style={{ color: COLORS.purple, marginTop: 4, fontSize: 13 }}>+{result.items_gained.length} items</MonoText>
          ) : null}
          {result.leveled_up ? (
            <View style={styles.lvUp}>
              <MonoText style={{ color: COLORS.green, fontSize: 14, fontWeight: "700" }}>★ LEVEL UP — LV {result.new_level}</MonoText>
            </View>
          ) : null}
          {result.new_achievements?.length ? (
            <View style={{ marginTop: 16 }}>
              {result.new_achievements.map((a: any) => (
                <View key={a.id} style={styles.achRow}>
                  <Ionicons name={a.icon} size={20} color={COLORS.amber} />
                  <MonoText style={{ color: COLORS.amber, marginLeft: 8 }}>UNLOCKED: {a.name}</MonoText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <NeonButton testID="mission-continue" label="Return to HQ" onPress={() => router.replace("/dashboard")} color={COLORS.green} variant="solid" />
      </ScrollView>
    );
  }

  if (result && !result.success) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={[styles.successBox, { borderColor: COLORS.red, shadowColor: COLORS.red }]}>
          <Ionicons name="warning" size={48} color={COLORS.red} />
          <TitleText style={{ color: COLORS.red, fontSize: 24, marginTop: 12 }}>FAILED</TitleText>
          <MutedText style={{ marginTop: 8, textAlign: "center" }}>{result.message || "Retry the mission."}</MutedText>
        </View>
        <NeonButton testID="mission-retry" label="Retry" onPress={() => { setResult(null); setSelected(null); }} color={COLORS.red} variant="outline" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable testID="mission-back" onPress={() => router.back()} style={{ marginBottom: 14 }}>
        <MonoText style={{ color: COLORS.cyan }}>← Back</MonoText>
      </Pressable>
      <NeonLabel color={COLORS.cyan}>{"// mission_brief.dat"}</NeonLabel>
      <TitleText style={styles.title}>{mission.title}</TitleText>
      <View style={styles.metaRow}>
        <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>★ {mission.difficulty}</MonoText>
        <MonoText style={{ color: COLORS.purple, fontSize: 11 }}>{mission.category.toUpperCase().replace("_", " ")}</MonoText>
      </View>

      <View style={styles.briefBox}>
        <NeonLabel color={COLORS.cyan}>BRIEFING</NeonLabel>
        <MonoText style={{ color: COLORS.textPrimary, marginTop: 8, lineHeight: 20 }}>{mission.story}</MonoText>
        <MonoText style={{ color: COLORS.green, marginTop: 12, fontSize: 12 }}>OBJECTIVE: {mission.objective}</MonoText>
        <MonoText style={{ color: COLORS.amber, marginTop: 8, fontSize: 11 }}>📚 LEARN: {mission.learning}</MonoText>
      </View>

      <View style={styles.rewardBox}>
        <NeonLabel color={COLORS.amber}>REWARDS</NeonLabel>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          <MonoText style={{ color: COLORS.green }}>+{mission.rewards.xp} XP</MonoText>
          <MonoText style={{ color: COLORS.cyan }}>+{mission.rewards.coins} CR</MonoText>
          {mission.rewards.items?.length ? <MonoText style={{ color: COLORS.purple }}>+{mission.rewards.items.length} item(s)</MonoText> : null}
        </View>
      </View>

      {mission.combat ? (
        <View style={styles.combatBox}>
          <Ionicons name="skull" size={28} color={COLORS.red} />
          <MonoText style={{ color: COLORS.red, marginTop: 8, fontSize: 14, fontWeight: "700" }}>BOSS ENCOUNTER</MonoText>
          <MutedText style={{ marginTop: 6, textAlign: "center" }}>{mission.enemy?.name}</MutedText>
          <NeonButton
            testID="enter-combat"
            label="Engage Combat"
            color={COLORS.red}
            variant="solid"
            onPress={() => router.push(`/combat/${mission.id}`)}
          />
        </View>
      ) : puzzle ? (
        <View style={{ marginTop: 18 }}>
          <NeonLabel color={COLORS.cyan}>CHALLENGE</NeonLabel>
          <MonoText style={{ color: COLORS.textPrimary, marginTop: 8, fontSize: 14, lineHeight: 20 }}>{puzzle.question}</MonoText>
          <View style={{ marginTop: 12 }}>
            {puzzle.options.map(o => (
              <Pressable
                key={o.id}
                testID={`puzzle-option-${o.id}`}
                onPress={() => setSelected(o.id)}
                style={[styles.option, { borderColor: selected === o.id ? COLORS.cyan : "rgba(0,240,255,0.15)" }]}
              >
                <Ionicons name={selected === o.id ? "radio-button-on" : "radio-button-off"} size={18} color={selected === o.id ? COLORS.cyan : COLORS.textMuted} />
                <MonoText style={{ color: selected === o.id ? COLORS.cyan : COLORS.textPrimary, marginLeft: 10, fontSize: 13 }}>{o.label}</MonoText>
              </Pressable>
            ))}
          </View>
          <NeonButton
            testID="submit-puzzle"
            label="Submit Solution"
            onPress={onSubmit}
            loading={submitting}
            disabled={!selected}
            color={COLORS.cyan}
            variant="solid"
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.cyan, fontSize: 28, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 1 },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 8, marginBottom: 16 },
  briefBox: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(0,240,255,0.2)", padding: 16, marginBottom: 14 },
  rewardBox: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,176,0,0.25)", padding: 16 },
  combatBox: { alignItems: "center", padding: 24, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,0,60,0.35)", marginTop: 20 },
  option: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, marginBottom: 8, backgroundColor: COLORS.surface },
  successBox: { alignItems: "center", padding: 28, borderWidth: 1, borderColor: "rgba(0,255,65,0.4)", marginVertical: 20, backgroundColor: COLORS.surface, shadowColor: COLORS.green, shadowOpacity: 0.5, shadowRadius: 18 },
  lvUp: { marginTop: 16, padding: 10, borderWidth: 1, borderColor: COLORS.green },
  achRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
});
