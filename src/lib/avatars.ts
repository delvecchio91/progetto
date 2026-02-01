// Level avatar mapping - centralized to avoid duplication
import level1Avatar from "@/assets/avatars/level-1.webp";
import level2Avatar from "@/assets/avatars/level-2.webp";
import level3Avatar from "@/assets/avatars/level-3.webp";
import level4Avatar from "@/assets/avatars/level-4.webp";
import level5Avatar from "@/assets/avatars/level-5.webp";
import level6Avatar from "@/assets/avatars/level-6.webp";

export const LEVEL_AVATAR_MAP: Record<string, string> = {
  apprendista: level1Avatar,
  tecnico_base: level2Avatar,
  tecnico_esperto: level3Avatar,
  specialista: level4Avatar,
  responsabile: level5Avatar,
  direttore: level6Avatar,
};

export const getAvatarByLevel = (level: string | null | undefined): string => {
  return LEVEL_AVATAR_MAP[level || "apprendista"] || level1Avatar;
};

export { level1Avatar, level2Avatar, level3Avatar, level4Avatar, level5Avatar, level6Avatar };
