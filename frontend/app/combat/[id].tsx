import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { AVATAR_MAP } from "@/src/utils/maps";

type Combat = {
  mission: any;
  player: { hp: number; max_hp: number; attack: number; defense: number; speed: number; name: string; avatar_id: string };
  enemy: { name: string; hp: number; attack: number; defense: number; speed: number; color: string };
  moves: { id: string; name: string; icon: string; damage: number; color: string; desc: string }[];
};

export default function CombatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [combat, setCombat] = useState<Combat | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [blocking, setBlocking] = useState(false);
  const [turn, setTurn] = useState<"player" | "enemy" | "over">("player");
  const [outcome, setOutcome] = useState<"win" | "lose" | null>(null);
  const [reward, setReward] = useState<any>(null);
  const [shake] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      try {
        const c = await api.get<Combat>(`/combat/${id}`);
        setCombat(c);
        setPlayerHp(c.player.hp);
        setEnemyHp(c.enemy.hp);
        setEnemyMaxHp(c.enemy.hp);
        setLog([`> Encountered ${c.enemy.name}.`, "> Initiate combat protocol."]);
      } catch {/* noop */}
    })();
  }, [id]);

  const shakeIt = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const submitOutcome = async (won: boolean) => {
    try {
      const res = await api.post<any>("/missions/complete", { mission_id: id, won, puzzle_correct: true });
      setReward(res);
    } catch { /* noop */ }
  };

  const endTurn = (newPlayerHp: number, newEnemyHp: number, msgs: string[]) => {
    setLog((l) => [...msgs, ...l].slice(0, 8));
    if (newEnemyHp <= 0) {
      setEnemyHp(0);
      setTurn("over");
      setOutcome("win");
      submitOutcome(true);
      return;
    }
    if (newPlayerHp <= 0) {
      setPlayerHp(0);
      setTurn("over");
      setOutcome("lose");
      submitOutcome(false);
      return;
    }
    setEnemyHp(newEnemyHp);
    setPlayerHp(newPlayerHp);
    setTurn("enemy");
    setTimeout(() => enemyTurn(newPlayerHp, newEnemyHp), 800);
  };

  const enemyTurn = (curPHp: number, curEHp: number) => {
    if (!combat) return;
    const e = combat.enemy;
    const p = combat.player;
    const raw = Math.max(4, e.attack - Math.floor(p.defense * 0.7));
    const dmg = blocking ? Math.floor(raw * 0.4) : raw;
    const newHp = Math.max(0, curPHp - dmg);
    setBlocking(false);
    shakeIt();
    endTurn(newHp, curEHp, [`> ${e.name} strikes for ${dmg} damage.`]);
    if (newHp > 0) setTurn("player");
  };

  const handleUseMove = (moveId: string) => {
    if (!combat || turn !== "player") return;
    const m = combat.moves.find(x => x.id === moveId)!;
    let newPHp = playerHp;
    let newEHp = enemyHp;
    const msgs: string[] = [];
    if (moveId === "encrypt") {
      newPHp = Math.min(combat.player.max_hp, playerHp + 30);
      msgs.push("> Encryption shield restores 30 HP.");
    } else if (moveId === "firewall") {
      setBlocking(true);
      msgs.push("> Firewall raised. Next enemy attack reduced.");
    } else {
      const raw = Math.max(6, Math.floor(combat.player.attack * m.damage - combat.enemy.defense * 0.6));
      const crit = Math.random() < 0.1;
      const dmg = crit ? Math.floor(raw * 1.6) : raw;
      newEHp = Math.max(0, enemyHp - dmg);
      msgs.push(`> ${m.name} hits for ${dmg}${crit ? " (CRITICAL!)" : ""}.`);
    }
    endTurn(newPHp, newEHp, msgs);
  };

  if (!combat) return <View style={styles.root}><MutedText style={{ padding: 24 }}>Initializing combat protocol...</MutedText></View>;

  const playerAv = AVATAR_MAP[combat.player.avatar_id] || { icon: "person", color: COLORS.cyan };
  const pPct = (playerHp / combat.player.max_hp) * 100;
  const ePct = (enemyHp / enemyMaxHp) * 100;

  if (outcome) {
    const isWin = outcome === "win";
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
        <View style={[styles.endBox, { borderColor: isWin ? COLORS.green : COLORS.red, shadowColor: isWin ? COLORS.green : COLORS.red }]}>
          <Ionicons name={isWin ? "trophy" : "skull"} size={56} color={isWin ? COLORS.green : COLORS.red} />
          <TitleText style={{ color: isWin ? COLORS.green : COLORS.red, fontSize: 28, marginTop: 12, letterSpacing: 3 }}>
            {isWin ? "VICTORY" : "TERMINATED"}
          </TitleText>
          <MutedText style={{ marginTop: 12, textAlign: "center" }}>
            {isWin ? `${combat.enemy.name} neutralized.` : `${combat.enemy.name} overpowered your defenses.`}
          </MutedText>
          {isWin && reward?.success ? (
            <View style={{ marginTop: 18, alignItems: "center" }}>
              <MonoText style={{ color: COLORS.amber, fontSize: 14 }}>+{reward.xp_gained} XP</MonoText>
              <MonoText style={{ color: COLORS.cyan, fontSize: 14, marginTop: 4 }}>+{reward.coins_gained} CR</MonoText>
              {reward.leveled_up ? <MonoText style={{ color: COLORS.green, marginTop: 6, fontSize: 13 }}>★ LEVEL UP — LV {reward.new_level}</MonoText> : null}
            </View>
          ) : null}
        </View>
        <NeonButton
          testID="combat-finish"
          label={isWin ? "Return to HQ" : "Retreat"}
          onPress={() => router.replace("/dashboard")}
          color={isWin ? COLORS.green : COLORS.red}
          variant="solid"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.red}>{"// combat_engaged"}</NeonLabel>
      <TitleText style={styles.title}>CYBER COMBAT</TitleText>

      {/* Enemy */}
      <Animated.View style={[styles.combatant, { borderColor: combat.enemy.color, shadowColor: combat.enemy.color, transform: [{ translateX: shake }] }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.enemyIcon, { borderColor: combat.enemy.color }]}>
            <Ionicons name="skull" size={36} color={combat.enemy.color} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <MonoText style={{ color: combat.enemy.color, fontSize: 16, fontWeight: "700" }}>{combat.enemy.name}</MonoText>
            <MutedText style={{ fontSize: 11 }}>ATK {combat.enemy.attack} · DEF {combat.enemy.defense}</MutedText>
            <View style={styles.hpBarBg}>
              <View style={[styles.hpBarFill, { width: `${ePct}%`, backgroundColor: combat.enemy.color }]} testID="enemy-hp-bar" />
            </View>
            <MonoText style={{ color: combat.enemy.color, fontSize: 11 }}>{enemyHp} / {enemyMaxHp}</MonoText>
          </View>
        </View>
      </Animated.View>

      {/* Battle log */}
      <View style={styles.logBox}>
        {log.slice(0, 6).map((l, i) => (
          <MonoText key={i} style={{ color: i === 0 ? COLORS.green : COLORS.textSecondary, fontSize: 11, marginVertical: 1 }}>
            {l}
          </MonoText>
        ))}
      </View>

      {/* Player */}
      <View style={[styles.combatant, { borderColor: playerAv.color, shadowColor: playerAv.color }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.enemyIcon, { borderColor: playerAv.color }]}>
            <Ionicons name={playerAv.icon as any} size={36} color={playerAv.color} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <MonoText style={{ color: playerAv.color, fontSize: 16, fontWeight: "700" }}>{combat.player.name}</MonoText>
            <MutedText style={{ fontSize: 11 }}>ATK {combat.player.attack} · DEF {combat.player.defense}</MutedText>
            <View style={styles.hpBarBg}>
              <View style={[styles.hpBarFill, { width: `${pPct}%`, backgroundColor: COLORS.green }]} testID="player-hp-bar" />
            </View>
            <MonoText style={{ color: COLORS.green, fontSize: 11 }}>{playerHp} / {combat.player.max_hp}</MonoText>
          </View>
        </View>
      </View>

      {/* Moves */}
      <NeonLabel color={COLORS.cyan} style={{ marginTop: 18 }}>{"// actions "}{turn === "enemy" ? "(enemy turn...)" : ""}</NeonLabel>
      <View style={styles.moveGrid}>
        {combat.moves.map(m => (
          <Pressable
            key={m.id}
            testID={`move-${m.id}`}
            disabled={turn !== "player"}
            onPress={() => handleUseMove(m.id)}
            style={[styles.moveBtn, { borderColor: m.color, shadowColor: m.color, opacity: turn === "player" ? 1 : 0.5 }]}
          >
            <Ionicons name={m.icon as any} size={22} color={m.color} />
            <MonoText style={{ color: m.color, fontSize: 12, marginTop: 6, fontWeight: "700" }}>{m.name}</MonoText>
            <MonoText style={{ color: COLORS.textMuted, fontSize: 9, marginTop: 2, textAlign: "center" }} numberOfLines={2}>{m.desc}</MonoText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.red, fontSize: 26, marginTop: 4, letterSpacing: 3, marginBottom: 14, fontFamily: FONT.heading, fontWeight: "900" },
  combatant: { borderWidth: 1, padding: 14, backgroundColor: COLORS.surface, shadowOpacity: 0.4, shadowRadius: 12, marginVertical: 8 },
  enemyIcon: { width: 62, height: 62, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceElevated },
  hpBarBg: { height: 8, backgroundColor: COLORS.surfaceElevated, marginTop: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  hpBarFill: { height: "100%" },
  logBox: { backgroundColor: "#000", borderWidth: 1, borderColor: "rgba(0,255,65,0.2)", padding: 10, marginVertical: 10, minHeight: 80 },
  moveGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moveBtn: { flexBasis: "48%", padding: 14, borderWidth: 1.5, alignItems: "center", backgroundColor: COLORS.surface, shadowOpacity: 0.5, shadowRadius: 10, minHeight: 100 },
  endBox: { alignItems: "center", padding: 30, borderWidth: 1.5, marginVertical: 20, backgroundColor: COLORS.surface, shadowOpacity: 0.6, shadowRadius: 18 },
});
