import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";

export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: "rgba(0,240,255,0.2)",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontFamily: FONT.bodyBold, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "HQ",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
          tabBarTestID: "tab-dashboard",
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          title: "Story",
          tabBarIcon: ({ color, size }) => <Ionicons name="git-network" size={size} color={color} />,
          tabBarTestID: "tab-story",
        }}
      />
      <Tabs.Screen
        name="npcs"
        options={{
          title: "NPCs",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          tabBarTestID: "tab-npcs",
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Gear",
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
          tabBarTestID: "tab-inventory",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          tabBarTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
