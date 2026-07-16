export const avatarPresetIds = [
  "birthday-bear",
  "birthday-bunny",
  "birthday-lion",
  "birthday-panda",
  "birthday-koala",
  "birthday-tiger",
  "birthday-star",
  "birthday-cupcake"
] as const;

export type AvatarPresetId = (typeof avatarPresetIds)[number];

export type ParticipantAvatarProjection =
  | {
      type: "photo";
      url: string;
    }
  | {
      type: "preset";
      presetId: AvatarPresetId;
    }
  | {
      type: "fallback";
      initials: string;
    };

export type StoredParticipantAvatar =
  | {
      type: "photo";
      path: string;
    }
  | {
      type: "preset";
      presetId: AvatarPresetId;
    }
  | null;

export function isAvatarPresetId(value: unknown): value is AvatarPresetId {
  return typeof value === "string" && avatarPresetIds.includes(value as AvatarPresetId);
}

export function getAvatarInitials(displayName: string | null | undefined) {
  const normalized = (displayName ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "?";
  }

  const parts = normalized.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return `${first}${last}`.toLocaleUpperCase();
}

export function fallbackAvatar(displayName: string | null | undefined): ParticipantAvatarProjection {
  return {
    type: "fallback",
    initials: getAvatarInitials(displayName)
  };
}
