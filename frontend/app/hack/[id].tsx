import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";

type Node = { id: string; ip: string; label: string; type: string; discovered: boolean; compromised: boolean };
type Edge = [string, string];
type Line = { output: string; kind: string };
type Session = {
  id: string;
  target: { id: string; name: string; ip: string; domain: string; faction: string; difficulty: string; story: string };
  stage: string;
  stage_index: number;
  nodes: Node[];
  edges: Edge[];
  history: Line[];
  discovered_ports: string[];
  trace_level: number;
  exploit_success: boolean;
  code_puzzle_solved: boolean;
  password_cracked: boolean;
  exfil_complete: boolean;
  pw_hash: string;
  puzzle_open?: boolean;
  cracker_open?: boolean;
};

const STAGES = [
  { id: "recon", label: "Recon", color: COLORS.cyan },
  { id: "exploit", label: "Exploit", color: COLORS.red },
  { id: "privesc", label: "Priv-Esc", color: COLORS.purple },
  { id: "exfil", label: "Exfil", color: COLORS.amber },
];

const KIND_COLOR: Record<string, string> = {
  input: COLORS.green,
  output: COLORS.textPrimary,
  error: COLORS.red,
  success: COLORS.green,
  hint: COLORS.amber,
  info: COLORS.cyan,
  system: COLORS.purple,
};

export default function HackTerminal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showCracker, setShowCracker] = useState(false);
  const [puzzle, setPuzzle] = useState<any>(null);
  const [crackerLines, setCrackerLines] = useState<string[]>([]);
  const [crackGuess, setCrackGuess] = useState("");
  const [crackBusy, setCrackBusy] = useState(false);
  const [puzzleBusy, setPuzzleBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        if (id && id !== "new") {
          const s = await api.get<Session>(`/hack/${id}`);
          setSession(s);
        } else {
          const s = await api.post<Session>("/hack/start", {});
          setSession(s);
          router.setParams({ id: s.id });
        }
      } catch { /* noop */ }
    })();
  }, [id, router]);

  useEffect(() => {
    if (session?.puzzle_open) setShowPuzzle(true);
    if (session?.cracker_open) setShowCracker(true);
  }, [session?.puzzle_open, session?.cracker_open]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [session?.history.length]);

  const sendCmd = async (cmd?: string) => {
    if (!session) return;
    const text = (cmd ?? input).trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    try {
      const s = await api.post<Session>("/hack/cmd", { session_id: session.id, command: text });
      setSession(s);
    } catch { /* noop */ }
    finally { setBusy(false); }
  };

  const openCracker = async () => {
    if (!session) return;
    setShowCracker(true);
    try {
      const r = await api.get<{ lines: string[] }>(`/hack/${session.id}/crack-progress`);
      setCrackerLines(r.lines);
    } catch { /* noop */ }
  };

  const submitCrack = async () => {
    if (!session || !crackGuess.trim()) return;
    setCrackBusy(true);
    try {
      const r = await api.post<{ ok: boolean; message: string; session: Session }>("/hack/crack",
        { session_id: session.id, guess: crackGuess });
      setSession(r.session);
      if (r.ok) {
        setShowCracker(false);
      }
    } catch { /* noop */ }
    finally { setCrackBusy(false); setCrackGuess(""); }
  };

  const openPuzzle = async () => {
    if (!session) return;
    setShowPuzzle(true);
    try {
      const p = await api.get<any>(`/hack/${session.id}/puzzle`);
      setPuzzle(p);
    } catch { /* noop */ }
  };

  const submitPuzzle = async (answer: string) => {
    if (!session) return;
    setPuzzleBusy(true);
    try {
      const r = await api.post<{ ok: boolean; session: Session }>("/hack/inject",
        { session_id: session.id, answer });
      setSession(r.session);
      if (r.ok) setShowPuzzle(false);
    } catch { /* noop */ }
    finally { setPuzzleBusy(false); }
  };

  const completeHack = async () => {
    if (!session) return;
    try {
      const r = await api.post<any>("/hack/complete", { target: session.id });
      setDone(r);
    } catch (e: any) { setDone({ error: e?.message }); }
  };

  if (!session) {
    return <View style={styles.root}><MutedText style={{ padding: 24 }}>Establishing tunnel...</MutedText></View>;
  }

  if (done) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={styles.victoryBox}>
          <Ionicons name="trophy" size={56} color={COLORS.amber} />
          <TitleText style={{ color: COLORS.amber, fontSize: 28, marginTop: 12 }}>HACK COMPLETE</TitleText>
          {done.error ? (
            <MonoText style={{ color: COLORS.red, marginTop: 12 }}>{done.error}</MonoText>
          ) : (
            <>
              <MonoText style={{ color: COLORS.green, marginTop: 14, fontSize: 14 }}>+{done.xp_gained} XP</MonoText>
              <MonoText style={{ color: COLORS.cyan, marginTop: 4, fontSize: 14 }}>+{done.coins_gained} CR</MonoText>
              {done.leveled_up ? <MonoText style={{ color: COLORS.green, marginTop: 8 }}>★ LEVEL UP — LV {done.new_level}</MonoText> : null}
              <MonoText style={{ color: COLORS.purple, marginTop: 18, fontSize: 11 }}>Faction trust updated.</MonoText>
            </>
          )}
        </View>
        <NeonButton testID="hack-done-return" label="Return to HQ" color={COLORS.amber} variant="solid" onPress={() => router.replace("/dashboard")} />
        <View style={{ marginTop: 12 }}>
          <NeonButton testID="hack-new" label="Start New Hack" small variant="outline" color={COLORS.green}
            onPress={() => router.replace("/hack/new")} />
        </View>
      </ScrollView>
    );
  }

  if (session.stage === "failed") {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={[styles.victoryBox, { borderColor: COLORS.red, shadowColor: COLORS.red }]}>
          <Ionicons name="alert-circle" size={56} color={COLORS.red} />
          <TitleText style={{ color: COLORS.red, fontSize: 24, marginTop: 12, textAlign: "center" }}>CONNECTION TRACED</TitleText>
          <MonoText style={{ color: COLORS.textPrimary, marginTop: 14, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            {"Your connection signature was fully resolved by the remote administrator's intrusion detection system. The tunnel was closed and your session was wiped."}
          </MonoText>
        </View>
        <NeonButton testID="hack-done-return" label="Return to HQ" color={COLORS.red} variant="solid" onPress={() => router.replace("/dashboard")} />
        <View style={{ marginTop: 12 }}>
          <NeonButton testID="hack-new" label="Retry Simulation" small variant="outline" color={COLORS.cyan}
            onPress={() => router.replace("/hack/new")} />
        </View>
      </ScrollView>
    );
  }

  const tgt = session.target;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable testID="hack-back" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.cyan} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <MonoText style={{ color: COLORS.green, fontSize: 11 }}>TARGET</MonoText>
          <MonoText style={{ color: COLORS.cyan, fontSize: 13, fontWeight: "700" }}>{tgt.name}</MonoText>
        </View>
        <Pressable testID="hack-map-toggle" onPress={() => setShowMap(true)} style={styles.headerBtn}>
          <Ionicons name="git-network" size={18} color={COLORS.purple} />
          <MonoText style={{ color: COLORS.purple, fontSize: 10, marginLeft: 4 }}>MAP</MonoText>
        </Pressable>
      </View>

      <View style={styles.stageBar}>
        {STAGES.map((s, i) => {
          const active = session.stage === s.id;
          const done = session.stage_index > i || session.stage === "done";
          return (
            <View key={s.id} style={styles.stageWrap}>
              <View style={[styles.stageDot, { borderColor: s.color, backgroundColor: done ? s.color : "transparent" }]}>
                {done ? <Ionicons name="checkmark" size={12} color={COLORS.bg} /> : null}
              </View>
              <MonoText style={{ color: active ? s.color : done ? s.color : COLORS.textMuted, fontSize: 9, marginTop: 4, fontWeight: active ? "700" : "400" }}>
                {s.label.toUpperCase()}
              </MonoText>
              {i < STAGES.length - 1 ? <View style={[styles.stageLine, { backgroundColor: done ? s.color : COLORS.textMuted }]} /> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.traceBar}>
        <MonoText style={{ color: COLORS.textMuted, fontSize: 9, letterSpacing: 1.5 }}>TRACE</MonoText>
        <View style={styles.traceBg}>
          <View style={[styles.traceFill, {
            width: `${session.trace_level}%`,
            backgroundColor: session.trace_level > 70 ? COLORS.red : session.trace_level > 40 ? COLORS.amber : COLORS.green,
          }]} />
        </View>
        <MonoText style={{ color: session.trace_level > 70 ? COLORS.red : COLORS.textSecondary, fontSize: 9, width: 30 }}>{session.trace_level}%</MonoText>
      </View>

      <ScrollView ref={scrollRef} style={styles.terminal} contentContainerStyle={{ padding: 10 }}>
        {session.history.map((l, i) => (
          <MonoText key={i} style={{ color: KIND_COLOR[l.kind] || COLORS.textPrimary, fontSize: 11, lineHeight: 16 }}>
            {l.output}
          </MonoText>
        ))}
        {busy ? <ActivityIndicator color={COLORS.green} style={{ marginTop: 6 }} /> : null}
      </ScrollView>

      {session.exfil_complete && !done ? (
        <View style={styles.claimBox}>
          <MonoText style={{ color: COLORS.amber, fontSize: 12, fontWeight: "700" }}>VAULT BREACHED</MonoText>
          <NeonButton testID="claim-hack-reward" label="Claim Rewards" small color={COLORS.amber} variant="solid" onPress={completeHack} />
        </View>
      ) : null}

      <View style={styles.quickRow}>
        {(["nmap " + tgt.ip, "ping " + tgt.ip, "clear-logs", "ls", "help", "map"]).map(q => (
          <Pressable key={q} testID={`quick-cmd-${q.split(" ")[0]}`} onPress={() => sendCmd(q)} style={styles.quickCmd}>
            <MonoText style={{ color: COLORS.cyan, fontSize: 10 }}>{q.length > 14 ? q.slice(0, 12) + "…" : q}</MonoText>
          </Pressable>
        ))}
        {session.stage === "privesc" && !session.code_puzzle_solved ? (
          <Pressable testID="open-inject" onPress={openPuzzle} style={[styles.quickCmd, { borderColor: COLORS.purple }]}>
            <Ionicons name="code-slash" size={11} color={COLORS.purple} />
            <MonoText style={{ color: COLORS.purple, fontSize: 10, marginLeft: 4 }}>inject</MonoText>
          </Pressable>
        ) : null}
        {session.stage === "privesc" && !session.password_cracked ? (
          <Pressable testID="open-cracker" onPress={openCracker} style={[styles.quickCmd, { borderColor: COLORS.red }]}>
            <Ionicons name="key" size={11} color={COLORS.red} />
            <MonoText style={{ color: COLORS.red, fontSize: 10, marginLeft: 4 }}>crack</MonoText>
          </Pressable>
        ) : null}
        {session.stage === "exfil" ? (
          <Pressable testID="quick-exfil" onPress={() => sendCmd("exfil")} style={[styles.quickCmd, { borderColor: COLORS.amber }]}>
            <Ionicons name="cloud-download" size={11} color={COLORS.amber} />
            <MonoText style={{ color: COLORS.amber, fontSize: 10, marginLeft: 4 }}>exfil</MonoText>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <MonoText style={{ color: COLORS.green, fontSize: 14 }}>$</MonoText>
          <TextInput
            testID="terminal-input"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendCmd()}
            placeholder="type a command..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
          />
          <Pressable testID="terminal-send" onPress={() => sendCmd()} disabled={busy}>
            <Ionicons name="return-down-forward" size={20} color={busy ? COLORS.textMuted : COLORS.green} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Network Map Modal */}
      <Modal visible={showMap} transparent animationType="fade" onRequestClose={() => setShowMap(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowMap(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <NeonLabel color={COLORS.purple}>NETWORK MAP</NeonLabel>
              <Pressable onPress={() => setShowMap(false)}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></Pressable>
            </View>
            <View style={{ marginTop: 10 }}>
              {session.nodes.map((n, i) => {
                const isDisc = n.discovered;
                const col = n.compromised ? COLORS.red : isDisc ? COLORS.cyan : COLORS.textMuted;
                return (
                  <View key={n.id} style={styles.nodeRow}>
                    {i > 0 ? <View style={[styles.vline, { backgroundColor: col }]} /> : null}
                    <View style={[styles.nodeCircle, { borderColor: col, backgroundColor: n.compromised ? `${COLORS.red}22` : COLORS.surface }]}>
                      <Ionicons name={n.compromised ? "skull" : isDisc ? "ellipse" : "help"} size={18} color={col} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <MonoText style={{ color: col, fontSize: 12, fontWeight: "700" }}>
                        {isDisc ? n.label : "???"}
                      </MonoText>
                      <MutedText style={{ fontSize: 10 }}>{isDisc ? `${n.ip} · ${n.type}` : "unknown host"}</MutedText>
                      {n.compromised ? <MonoText style={{ color: COLORS.red, fontSize: 10, marginTop: 2 }}>⚠ COMPROMISED</MonoText> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Code Injection Puzzle */}
      <Modal visible={showPuzzle} transparent animationType="fade" onRequestClose={() => setShowPuzzle(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPuzzle(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <NeonLabel color={COLORS.purple}>CODE INJECTION</NeonLabel>
              <Pressable onPress={() => setShowPuzzle(false)}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></Pressable>
            </View>
            <MutedText style={{ marginVertical: 10, fontSize: 12 }}>
              Complete the missing line. Wrong syntax = privesc denied.
            </MutedText>
            {!puzzle ? <ActivityIndicator color={COLORS.purple} /> : (
              <>
                <View style={styles.codeBox}>
                  {puzzle.code_template.map((line: string, i: number) => (
                    <MonoText key={i} style={{
                      color: line.trim() === "____" ? COLORS.amber : COLORS.green,
                      fontSize: 12, lineHeight: 18,
                    }}>
                      {line}
                    </MonoText>
                  ))}
                </View>
                <MonoText style={{ color: COLORS.amber, fontSize: 11, marginTop: 6 }}>💡 {puzzle.hint}</MonoText>
                <View style={{ marginTop: 12 }}>
                  {puzzle.options.map((opt: string, i: number) => (
                    <Pressable
                      key={i}
                      testID={`puzzle-opt-${i}`}
                      disabled={puzzleBusy}
                      onPress={() => submitPuzzle(opt)}
                      style={styles.puzzleOpt}
                    >
                      <MonoText style={{ color: COLORS.textPrimary, fontSize: 11 }}>{opt}</MonoText>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Password Cracker */}
      <Modal visible={showCracker} transparent animationType="fade" onRequestClose={() => setShowCracker(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowCracker(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <NeonLabel color={COLORS.red}>HASH CRACKER</NeonLabel>
              <Pressable onPress={() => setShowCracker(false)}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></Pressable>
            </View>
            <MonoText style={{ color: COLORS.amber, fontSize: 11, marginTop: 6 }}>HASH: {session.pw_hash}</MonoText>
            <MutedText style={{ marginVertical: 8, fontSize: 11 }}>
              Pick a candidate from the dictionary, or type your own guess.
            </MutedText>
            <View style={styles.crackerBox}>
              <FlatList
                data={crackerLines}
                keyExtractor={(_, i) => `cl-${i}`}
                renderItem={({ item }) => {
                  const [hash, pw] = item.split("  ← ");
                  return (
                    <Pressable
                      testID={`crack-pick-${pw}`}
                      onPress={() => setCrackGuess(pw)}
                      style={styles.crackRow}
                    >
                      <MonoText style={{ color: COLORS.cyan, fontSize: 10 }}>{hash.slice(0, 24)}…</MonoText>
                      <MonoText style={{ color: COLORS.green, fontSize: 10, marginLeft: 8 }}>{pw}</MonoText>
                    </Pressable>
                  );
                }}
              />
            </View>
            <View style={styles.crackInputRow}>
              <TextInput
                testID="crack-guess-input"
                value={crackGuess}
                onChangeText={setCrackGuess}
                placeholder="enter guess..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.crackInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <NeonButton testID="crack-submit" label={crackBusy ? "..." : "Crack"} small color={COLORS.red} variant="solid" onPress={submitCrack} loading={crackBusy} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderColor: "rgba(0,255,65,0.2)", backgroundColor: COLORS.surface },
  headerBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.purple },
  stageBar: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, justifyContent: "space-between", backgroundColor: COLORS.surface },
  stageWrap: { alignItems: "center", flexDirection: "row" },
  stageDot: { width: 20, height: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stageLine: { width: 18, height: 1.5, marginHorizontal: 4 },
  traceBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 8, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: "rgba(0,255,65,0.1)" },
  traceBg: { flex: 1, height: 4, backgroundColor: COLORS.surfaceElevated },
  traceFill: { height: 4 },
  terminal: { flex: 1, backgroundColor: "#000" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 8, backgroundColor: COLORS.surface },
  quickCmd: { paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.cyan, flexDirection: "row", alignItems: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: "rgba(0,255,65,0.2)" },
  input: { flex: 1, color: COLORS.green, fontFamily: FONT.body, paddingVertical: 8, fontSize: 13 },
  claimBox: { padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.amber, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.purple, padding: 18, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nodeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, position: "relative" },
  vline: { position: "absolute", left: 16, top: -10, width: 2, height: 12 },
  nodeCircle: { width: 36, height: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  codeBox: { backgroundColor: "#000", padding: 12, borderWidth: 1, borderColor: "rgba(157,0,255,0.3)", marginTop: 10 },
  puzzleOpt: { padding: 12, borderWidth: 1, borderColor: "rgba(157,0,255,0.3)", marginBottom: 6, backgroundColor: COLORS.surfaceElevated },
  crackerBox: { height: 180, backgroundColor: "#000", padding: 8, borderWidth: 1, borderColor: "rgba(255,0,60,0.3)" },
  crackRow: { paddingVertical: 6, flexDirection: "row" },
  crackInputRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  crackInput: { flex: 1, backgroundColor: "#000", borderWidth: 1, borderColor: "rgba(255,0,60,0.3)", color: COLORS.red, padding: 10, fontFamily: FONT.body, fontSize: 12 },
  victoryBox: { alignItems: "center", padding: 30, borderWidth: 1, borderColor: COLORS.amber, marginVertical: 20, backgroundColor: COLORS.surface, shadowColor: COLORS.amber, shadowOpacity: 0.6, shadowRadius: 18 },
});
