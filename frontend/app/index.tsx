import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { loading, user, hasCharacter } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!hasCharacter) router.replace("/character-creation");
    else router.replace("/dashboard");
  }, [loading, user, hasCharacter, router]);

  return (
    <View style={styles.container} testID="splash">
      <ActivityIndicator color={COLORS.cyan} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
});
