import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel } from "@/src/components/Typography";

type Msg = { role: "user" | "assistant"; content: string; ts?: string };

const APPROACHES = [
  { id: "flatter", label: "Flatter", color: COLORS.cyan, icon: "happy" },
  { id: "sympathize", label: "Sympathize", color: COLORS.green, icon: "heart" },
  { id: "bargain", label: "Bargain", color: COLORS.amber, icon: "swap-horizontal" },
  { id: "threaten", label: "Threaten", color: COLORS.red, icon: "warning" },
];

export default function NPCDialogue() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [npc, setNpc] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [trust, setTrust] = useState(0);
  const [showPersuade, setShowPersuade] = useState(false);
  const [persuadeBusy, setPersuadeBusy] = useState(false);
  const [persuadeResult, setPersuadeResult] = useState<{ delta: number; trust: number; reaction: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const n = await api.get<any>(`/npcs/${id}`);
        setNpc(n);
        const [hist, t] = await Promise.all([
          api.get<{ messages: Msg[] }>(`/npcs/${id}/history`),
          api.get<{ trust: Record<string, number> }>(`/npcs/trust`),
        ]);
        setTrust(t.trust?.[id as string] ?? 0);
        if (hist.messages?.length) {
          setMessages(hist.messages);
        } else {
          setMessages([{ role: "assistant", content: n.intro }]);
        }
      } catch { /* noop */ }
    })();
  }, [id]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/npcs/chat", { npc_id: id, message: text });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "[Channel disrupted.]" }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const persuade = async (approach: string) => {
    setPersuadeBusy(true);
    setPersuadeResult(null);
    try {
      const r = await api.post<any>("/npcs/persuade", { npc_id: id, approach });
      setTrust(r.trust);
      setPersuadeResult({ delta: r.delta, trust: r.trust, reaction: r.reaction });
      setMessages((m) => [
        ...m,
        { role: "user", content: `[Approach: ${approach}]` },
        { role: "assistant", content: r.reaction },
      ]);
    } catch { /* noop */ }
    finally { setPersuadeBusy(false); }
  };

  if (!npc) return <View style={styles.root}><MutedText style={{ padding: 24 }}>Connecting...</MutedText></View>;

  const trustCol = trust >= 30 ? COLORS.green : trust <= -30 ? COLORS.red : COLORS.amber;
  const quickReplies = ["What's the situation?", "Brief me on the Phantom Grid.", "Any leads on Helix Corp?"];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { borderColor: npc.color }]}>
        <Pressable testID="npc-back" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.cyan} />
        </Pressable>
        <View style={[styles.portrait, { borderColor: npc.color, shadowColor: npc.color }]}>
          {npc.portrait ? (
            <Image source={{ uri: npc.portrait }} style={styles.portraitImg} />
          ) : (
            <Ionicons name={npc.icon as any} size={28} color={npc.color} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <MonoText style={{ color: npc.color, fontSize: 13, fontWeight: "700" }}>{npc.name}</MonoText>
          <MutedText style={{ fontSize: 10 }}>{npc.role} · {npc.faction}</MutedText>
          <View style={styles.trustRow}>
            <MonoText style={{ color: COLORS.textMuted, fontSize: 9 }}>TRUST</MonoText>
            <View style={styles.trustBg}>
              <View style={styles.trustAxis} />
              <View style={[styles.trustFill, { backgroundColor: trustCol, width: `${Math.abs(trust) / 2}%`, left: trust >= 0 ? "50%" : `${50 - Math.abs(trust) / 2}%` }]} />
            </View>
            <MonoText style={{ color: trustCol, fontSize: 10 }}>{trust > 0 ? "+" : ""}{trust}</MonoText>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={{ padding: 16 }}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgRow, m.role === "user" && { alignItems: "flex-end" }]}>
            <View style={[
              styles.bubble,
              m.role === "user"
                ? { borderColor: COLORS.cyan, backgroundColor: "rgba(0,240,255,0.08)" }
                : { borderColor: npc.color, backgroundColor: "rgba(10,10,15,0.85)" },
            ]}>
              {m.role === "assistant" ? (
                <MonoText style={{ color: npc.color, fontSize: 10, marginBottom: 4, letterSpacing: 1.4, textTransform: "uppercase" }}>
                  {npc.name}
                </MonoText>
              ) : null}
              <MonoText style={{ color: COLORS.textPrimary, fontSize: 13, lineHeight: 19 }}>{m.content}</MonoText>
            </View>
          </View>
        ))}
        {sending ? (
          <View style={[styles.bubble, { borderColor: npc.color, alignSelf: "flex-start" }]}>
            <ActivityIndicator color={npc.color} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.quickRow}>
        {quickReplies.map((q, i) => (
          <Pressable key={i} testID={`quick-${i}`} onPress={() => send(q)} style={[styles.quickReply, { borderColor: npc.color }]}>
            <MonoText style={{ color: npc.color, fontSize: 10 }} numberOfLines={1}>{q}</MonoText>
          </Pressable>
        ))}
      </View>

      <View style={styles.engineerBar}>
        <Pressable testID="open-persuade" onPress={() => setShowPersuade(true)} style={styles.engineerBtn}>
          <Ionicons name="people" size={14} color={COLORS.purple} />
          <MonoText style={{ color: COLORS.purple, fontSize: 10, marginLeft: 6 }}>SOCIAL ENGINEER</MonoText>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputRow, { borderColor: npc.color }]}>
          <TextInput
            testID="npc-message-input"
            value={input}
            onChangeText={setInput}
            placeholder="Transmit message..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable testID="npc-send-button" onPress={() => send(input)} disabled={sending || !input.trim()} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color={sending ? COLORS.textMuted : npc.color} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showPersuade} transparent animationType="fade" onRequestClose={() => setShowPersuade(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPersuade(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <NeonLabel color={COLORS.purple}>SOCIAL ENGINEERING</NeonLabel>
              <Pressable onPress={() => setShowPersuade(false)}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></Pressable>
            </View>
            <MutedText style={{ marginVertical: 10, fontSize: 12 }}>
              {"Pick an approach. Outcomes depend on "}{npc.name}{"'s personality, current trust, and your Social Engineering stat."}
            </MutedText>
            <View style={styles.approachGrid}>
              {APPROACHES.map((a) => (
                <Pressable
                  key={a.id}
                  testID={`approach-${a.id}`}
                  disabled={persuadeBusy}
                  onPress={() => persuade(a.id)}
                  style={[styles.approachBtn, { borderColor: a.color, opacity: persuadeBusy ? 0.5 : 1 }]}
                >
                  <Ionicons name={a.icon as any} size={20} color={a.color} />
                  <MonoText style={{ color: a.color, fontSize: 11, marginTop: 6, fontWeight: "700" }}>{a.label.toUpperCase()}</MonoText>
                </Pressable>
              ))}
            </View>
            {persuadeBusy ? <ActivityIndicator color={COLORS.purple} style={{ marginTop: 14 }} /> : null}
            {persuadeResult ? (
              <View style={{ marginTop: 14 }}>
                <MonoText style={{ color: persuadeResult.delta >= 0 ? COLORS.green : COLORS.red, fontSize: 12 }}>
                  TRUST {persuadeResult.delta >= 0 ? "+" : ""}{persuadeResult.delta} → {persuadeResult.trust}
                </MonoText>
                <MonoText style={{ color: COLORS.textPrimary, fontSize: 12, marginTop: 8, lineHeight: 18, fontStyle: "italic" }}>
                  &ldquo;{persuadeResult.reaction}&rdquo;
                </MonoText>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, backgroundColor: COLORS.surface,
  },
  portrait: {
    width: 56, height: 56, borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated, shadowOpacity: 0.6, shadowRadius: 8, marginLeft: 12, overflow: "hidden",
  },
  portraitImg: { width: 56, height: 56 },
  trustRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  trustBg: { flex: 1, height: 5, backgroundColor: COLORS.surfaceElevated, position: "relative", overflow: "hidden" },
  trustAxis: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: COLORS.textMuted },
  trustFill: { position: "absolute", top: 0, bottom: 0 },
  chat: { flex: 1 },
  msgRow: { marginBottom: 12 },
  bubble: { padding: 12, borderWidth: 1, maxWidth: "85%" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 8 },
  quickReply: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "32%" },
  engineerBar: { paddingHorizontal: 8, paddingBottom: 4 },
  engineerBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "rgba(157,0,255,0.4)", alignSelf: "flex-start" },
  inputRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, padding: 8, backgroundColor: COLORS.surface },
  input: { flex: 1, color: COLORS.textPrimary, fontFamily: FONT.body, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sendBtn: { padding: 10 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.purple, padding: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  approachGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  approachBtn: { flexBasis: "48%", padding: 14, borderWidth: 1, alignItems: "center", backgroundColor: COLORS.surfaceElevated, minHeight: 80, justifyContent: "center" },
});
