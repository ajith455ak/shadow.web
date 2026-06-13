import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { RARITY_COLOR } from "@/src/utils/maps";

export default function Inventory() {
  const [data, setData] = useState<any>({ items: [], equipment: {} });

  const load = useCallback(async () => {
    try { setData(await api.get<any>("/inventory")); } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const equip = async (id: string) => {
    try { await api.post("/inventory/equip", { item_id: id }); await load(); } catch { /* noop */ }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.cyan}>{"// arsenal.dat"}</NeonLabel>
      <TitleText style={styles.title}>GEAR</TitleText>
      <MutedText style={{ marginBottom: 14 }}>Your tools, equipment, and consumables.</MutedText>

      <View style={styles.equipBox}>
        <NeonLabel color={COLORS.amber}>EQUIPPED</NeonLabel>
        <View style={styles.equipRow}>
          {["head", "body", "tool"].map((slot) => {
            const id = (data.equipment || {})[slot];
            const item = data.items.find((it: any) => it.id === id);
            return (
              <View key={slot} style={styles.equipSlot}>
                <MonoText style={{ color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>{slot}</MonoText>
                {item ? (
                  <>
                    <Ionicons name={item.icon as any} size={28} color={RARITY_COLOR[item.rarity]} style={{ marginTop: 8 }} />
                    <MonoText style={{ color: RARITY_COLOR[item.rarity], fontSize: 10, marginTop: 4, textAlign: "center" }}>{item.name}</MonoText>
                  </>
                ) : (
                  <Ionicons name="add-outline" size={28} color={COLORS.textMuted} style={{ marginTop: 8 }} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <NeonLabel color={COLORS.cyan} style={{ marginTop: 18 }}>{"// inventory"}</NeonLabel>
      <View style={styles.grid}>
        {data.items.length === 0 ? (
          <MutedText style={{ padding: 18 }}>Inventory empty. Complete missions to acquire gear.</MutedText>
        ) : data.items.map((item: any) => (
          <Pressable
            key={item.id}
            testID={`item-${item.id}`}
            onPress={() => item.type === "equipment" && equip(item.id)}
            style={[styles.itemCard, { borderColor: RARITY_COLOR[item.rarity], shadowColor: RARITY_COLOR[item.rarity] }]}
          >
            {item.count > 1 ? <MonoText style={styles.count}>x{item.count}</MonoText> : null}
            <Ionicons name={item.icon as any} size={32} color={RARITY_COLOR[item.rarity]} />
            <MonoText style={{ color: RARITY_COLOR[item.rarity], fontSize: 11, marginTop: 6, textAlign: "center", fontWeight: "700" }}>
              {item.name}
            </MonoText>
            <MutedText style={{ fontSize: 9, marginTop: 4, textAlign: "center" }} numberOfLines={2}>{item.description}</MutedText>
            <MonoText style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4, textTransform: "uppercase" }}>{item.rarity}</MonoText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.cyan, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  equipBox: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "rgba(255,176,0,0.3)", padding: 14, marginTop: 12 },
  equipRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  equipSlot: {
    width: 90, height: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: COLORS.surfaceElevated, padding: 8, alignItems: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  itemCard: {
    flexBasis: "48%", padding: 14, borderWidth: 1, backgroundColor: COLORS.surface,
    minHeight: 120, alignItems: "center", shadowOpacity: 0.3, shadowRadius: 10,
  },
  count: { position: "absolute", top: 6, right: 8, color: COLORS.cyan, fontSize: 11 },
});
