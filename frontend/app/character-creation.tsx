import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { NeonButton } from "@/src/components/NeonButton";
import { CyberInput } from "@/src/components/CyberInput";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

type Avatar = { id: string; icon: any; color: string };
type CyberClass = {
  id: string; name: string; icon: any; color: string; description: string;
  starting_stats: Record<string, number>; bonus: string;
};

export default function CharacterCreation() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [classes, setClasses] = useState<CyberClass[]>([]);
  const [name, setName] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [classIdx, setClassIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const opts = await api.get<{ avatars: Avatar[]; classes: CyberClass[] }>("/character/options");
        setAvatars(opts.avatars);
        setClasses(opts.classes);
      } catch (e: any) {
        setErr(e?.message || "Failed to load options");
      }
    })();
  }, []);

  const create = async () => {
    setErr(null);
    if (!name || name.length < 2) { setErr("Enter a codename"); return; }
    setLoading(true);
    try {
      await api.post("/character", {
        name: name.trim(),
        avatar_id: avatars[avatarIdx].id,
        cyber_class: classes[classIdx].id,
      });
      await refresh();
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  if (!avatars.length || !classes.length) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <MutedText>Loading character matrix...</MutedText>
      </View>
    );
  }

  const selectedAvatar = avatars[avatarIdx];
  const selectedClass = classes[classIdx];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.cyan}>{"// genesis_protocol_v1.0"}</NeonLabel>
      <TitleText style={styles.title}>BUILD YOUR{"\n"}OPERATIVE</TitleText>

      <CyberInput
        testID="character-name-input"
        label="Codename"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cipher, Nyx, Glitch"
        maxLength={24}
      />

      <NeonLabel color={COLORS.purple} style={{ marginTop: 4 }}>{"// select avatar"}</NeonLabel>
      <View style={styles.avatarPreview}>
        <View style={[styles.avatarBig, { borderColor: selectedAvatar.color, shadowColor: selectedAvatar.color }]}>
          <Ionicons name={selectedAvatar.icon as any} size={72} color={selectedAvatar.color} />
        </View>
        <MonoText style={{ color: selectedAvatar.color, marginTop: 8, fontSize: 12 }}>
          {selectedAvatar.id.toUpperCase()}
        </MonoText>
      </View>
      <FlatList
        horizontal
        data={avatars}
        keyExtractor={(a) => a.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item, index }) => (
          <Pressable
            testID={`avatar-${item.id}`}
            onPress={() => setAvatarIdx(index)}
            style={[
              styles.avatarPick,
              {
                borderColor: index === avatarIdx ? item.color : "rgba(255,255,255,0.05)",
                shadowColor: index === avatarIdx ? item.color : "transparent",
              },
            ]}
          >
            <Ionicons name={item.icon as any} size={28} color={item.color} />
          </Pressable>
        )}
      />

      <NeonLabel color={COLORS.green} style={{ marginTop: 24 }}>{"// select cyber class"}</NeonLabel>
      <View style={styles.classGrid}>
        {classes.map((c, i) => (
          <Pressable
            key={c.id}
            testID={`class-${c.id}`}
            onPress={() => setClassIdx(i)}
            style={[
              styles.classCard,
              {
                borderColor: i === classIdx ? c.color : "rgba(255,255,255,0.08)",
                shadowColor: i === classIdx ? c.color : "transparent",
                backgroundColor: i === classIdx ? `${c.color}10` : COLORS.surface,
              },
            ]}
          >
            <Ionicons name={c.icon as any} size={28} color={c.color} />
            <MonoText style={{ color: c.color, marginTop: 8, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
              {c.name}
            </MonoText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.classDetail, { borderColor: selectedClass.color }]}>
        <MonoText style={{ color: selectedClass.color, fontSize: 14, fontWeight: "700" }}>
          {selectedClass.name.toUpperCase()}
        </MonoText>
        <MutedText style={{ marginTop: 8 }}>{selectedClass.description}</MutedText>
        <MonoText style={{ color: COLORS.amber, marginTop: 10, fontSize: 11 }}>
          ⚡ BONUS: {selectedClass.bonus}
        </MonoText>
        <View style={styles.statsGrid}>
          {Object.entries(selectedClass.starting_stats).map(([k, v]) => (
            <View key={k} style={styles.statRow}>
              <MonoText style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>{k.replace("_", " ")}</MonoText>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarFill, { width: `${(v as number) * 10}%`, backgroundColor: selectedClass.color }]} />
              </View>
              <MonoText style={{ color: selectedClass.color, fontSize: 10, width: 24 }}>{v}</MonoText>
            </View>
          ))}
        </View>
      </View>

      {err ? <MonoText style={{ color: COLORS.red, marginTop: 10, fontSize: 12 }}>{err}</MonoText> : null}

      <NeonButton
        testID="create-character-button"
        label="Initialize Operative"
        onPress={create}
        loading={loading}
        color={selectedClass.color}
        variant="solid"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 30, color: COLORS.cyan, lineHeight: 34, marginBottom: 24, letterSpacing: 2, fontFamily: FONT.heading, fontWeight: "900" },
  avatarPreview: { alignItems: "center", marginVertical: 12 },
  avatarBig: {
    width: 130, height: 130, borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.surface, shadowOpacity: 0.6, shadowRadius: 18,
  },
  avatarPick: {
    width: 56, height: 56, borderWidth: 1.5, marginRight: 10,
    alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface,
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  classGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 },
  classCard: {
    width: "31%", padding: 12, borderWidth: 1.5, alignItems: "center",
    shadowOpacity: 0.5, shadowRadius: 10, minHeight: 92,
  },
  classDetail: { padding: 16, borderWidth: 1, marginVertical: 16, backgroundColor: COLORS.surface },
  statsGrid: { marginTop: 14 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statBarBg: { flex: 1, height: 6, backgroundColor: COLORS.surfaceElevated, marginHorizontal: 8 },
  statBarFill: { height: 6 },
});
