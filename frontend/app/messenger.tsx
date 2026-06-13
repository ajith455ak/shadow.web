import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";

const PRIORITY_COLOR: Record<string, string> = {
  info: COLORS.cyan,
  warning: COLORS.amber,
  threat: COLORS.red,
  tipoff: COLORS.green,
};

const PRIORITY_LABEL: Record<string, string> = {
  info: "INFO",
  warning: "WARN",
  threat: "THREAT",
  tipoff: "TIP-OFF",
};

export default function Messenger() {
  const router = useRouter();
  const [data, setData] = useState<{ messages: any[]; unread: number }>({ messages: [], unread: 0 });

  const load = useCallback(async () => {
    try {
      const d = await api.get<any>("/messenger/inbox");
      setData(d);
      if (d.unread > 0) await api.post("/messenger/read");
    } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const seedTipoffs = async () => {
    try { await api.post("/messenger/seed-tipoffs"); await load(); } catch { /* noop */ }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <MonoText style={{ color: COLORS.cyan, marginBottom: 8 }}>← Back</MonoText>
      </Pressable>
      <NeonLabel color={COLORS.green}>{"// secure_messenger.enc"}</NeonLabel>
      <TitleText style={styles.title}>MESSAGES</TitleText>
      <MutedText style={{ marginVertical: 8 }}>
        Encrypted comms from your network. {data.messages.length === 0 ? "Inbox empty." : `${data.messages.length} transmissions logged.`}
      </MutedText>

      {data.messages.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-open" size={42} color={COLORS.textMuted} />
          <MutedText style={{ marginTop: 12, textAlign: "center" }}>No incoming transmissions yet.</MutedText>
          <View style={{ marginTop: 20 }}>
            <NeonButton testID="seed-tipoffs" label="Request Tip-Offs" small color={COLORS.green} onPress={seedTipoffs} />
          </View>
        </View>
      ) : (
        <>
          {data.messages.map((m) => {
            const col = PRIORITY_COLOR[m.priority] || COLORS.cyan;
            return (
              <View key={m.id} testID={`message-${m.id}`} style={[styles.card, { borderColor: col, shadowColor: col }]}>
                <View style={styles.row}>
                  <View style={[styles.av, { borderColor: m.sender_color || col }]}>
                    {m.sender_portrait ? (
                      <Image source={{ uri: m.sender_portrait }} style={styles.avImg} />
                    ) : (
                      <Ionicons name="person-circle" size={32} color={m.sender_color || col} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MonoText style={{ color: m.sender_color || col, fontSize: 13, fontWeight: "700", flex: 1 }}>
                        {m.sender_name}
                      </MonoText>
                      <View style={[styles.pill, { borderColor: col }]}>
                        <MonoText style={{ color: col, fontSize: 9, letterSpacing: 1.5 }}>{PRIORITY_LABEL[m.priority]}</MonoText>
                      </View>
                    </View>
                    <MonoText style={{ color: COLORS.textPrimary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
                      {m.text}
                    </MonoText>
                    <MonoText style={{ color: COLORS.textMuted, fontSize: 9, marginTop: 6 }}>
                      {new Date(m.created_at).toLocaleString()}
                    </MonoText>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ marginTop: 12 }}>
            <NeonButton testID="seed-more-tipoffs" label="Refresh Tip-Offs" small variant="outline" color={COLORS.green} onPress={seedTipoffs} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.green, fontSize: 28, letterSpacing: 3, fontFamily: FONT.heading, fontWeight: "900" },
  empty: { padding: 40, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: COLORS.surface, marginTop: 20 },
  card: { padding: 14, borderWidth: 1, backgroundColor: COLORS.surface, marginBottom: 10, shadowOpacity: 0.3, shadowRadius: 12 },
  row: { flexDirection: "row" },
  av: { width: 44, height: 44, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated, overflow: "hidden" },
  avImg: { width: 44, height: 44 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
});
