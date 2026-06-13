/** Cached avatar & class lookup maps populated from /character/options endpoint. */
import { COLORS } from "@/src/theme";

export const AVATAR_MAP: Record<string, { icon: string; color: string }> = {
  avatar_1: { icon: "hardware-chip", color: COLORS.cyan },
  avatar_2: { icon: "eye", color: COLORS.purple },
  avatar_3: { icon: "flash", color: COLORS.green },
  avatar_4: { icon: "skull", color: COLORS.red },
  avatar_5: { icon: "shield", color: COLORS.amber },
  avatar_6: { icon: "planet", color: COLORS.cyan },
  avatar_7: { icon: "rocket", color: COLORS.purple },
  avatar_8: { icon: "flame", color: COLORS.red },
  avatar_9: { icon: "snow", color: COLORS.cyan },
  avatar_10: { icon: "glasses", color: COLORS.green },
  avatar_11: { icon: "pulse", color: COLORS.purple },
  avatar_12: { icon: "bug", color: COLORS.red },
  avatar_13: { icon: "wifi", color: COLORS.green },
  avatar_14: { icon: "nuclear", color: COLORS.amber },
  avatar_15: { icon: "triangle", color: COLORS.cyan },
  avatar_16: { icon: "diamond", color: COLORS.purple },
  avatar_17: { icon: "flower", color: COLORS.red },
  avatar_18: { icon: "ellipsis-horizontal", color: COLORS.green },
  avatar_19: { icon: "infinite", color: COLORS.amber },
  avatar_20: { icon: "key", color: COLORS.cyan },
  avatar_21: { icon: "scan", color: COLORS.purple },
  avatar_22: { icon: "rose", color: COLORS.red },
};

export const CLASS_MAP: Record<string, { name: string; icon: string; color: string }> = {
  security_analyst: { name: "Security Analyst", icon: "shield-checkmark", color: COLORS.cyan },
  penetration_tester: { name: "Penetration Tester", icon: "bug", color: COLORS.red },
  malware_hunter: { name: "Malware Hunter", icon: "skull", color: COLORS.purple },
  network_defender: { name: "Network Defender", icon: "wifi", color: COLORS.green },
  digital_forensics: { name: "Digital Forensics Expert", icon: "search", color: COLORS.amber },
};

export const RARITY_COLOR: Record<string, string> = {
  common: "#94A3B8",
  rare: COLORS.cyan,
  epic: COLORS.purple,
  legendary: COLORS.amber,
};
