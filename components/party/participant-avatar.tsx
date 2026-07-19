import { CakeSlice, Crown, Gift, PartyPopper, Rabbit, Star } from "lucide-react";

import {
  avatarPresetIds,
  fallbackAvatar,
  type AvatarPresetId,
  type ParticipantAvatarProjection
} from "@/lib/party-avatar";
import { cn } from "@/lib/utils";

type ParticipantAvatarProps = {
  avatar?: ParticipantAvatarProjection | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl"
};

const presetMeta: Record<
  AvatarPresetId,
  {
    label: string;
    background: string;
    face: string;
    accent: string;
    icon: typeof PartyPopper;
  }
> = {
  "birthday-bear": {
    label: "Birthday bear",
    background: "bg-surface-highlight",
    face: "bg-[#d99056]",
    accent: "bg-party-blue",
    icon: PartyPopper
  },
  "birthday-bunny": {
    label: "Birthday bunny",
    background: "bg-surface-sky",
    face: "bg-[#f4d7d9]",
    accent: "bg-party-yellow",
    icon: Rabbit
  },
  "birthday-lion": {
    label: "Birthday lion",
    background: "bg-[#fff0c7]",
    face: "bg-party-orange",
    accent: "bg-party-blue",
    icon: Crown
  },
  "birthday-panda": {
    label: "Birthday panda",
    background: "bg-surface-paper",
    face: "bg-[#f7f1e5]",
    accent: "bg-foreground",
    icon: Gift
  },
  "birthday-koala": {
    label: "Birthday koala",
    background: "bg-[#d9edf5]",
    face: "bg-[#9eb2bd]",
    accent: "bg-party-yellow",
    icon: CakeSlice
  },
  "birthday-tiger": {
    label: "Birthday tiger",
    background: "bg-[#ffe2c2]",
    face: "bg-[#f49c46]",
    accent: "bg-party-blue",
    icon: Star
  },
  "birthday-star": {
    label: "Cheerful star",
    background: "bg-surface-highlight",
    face: "bg-party-yellow",
    accent: "bg-party-orange",
    icon: Star
  },
  "birthday-cupcake": {
    label: "Birthday cupcake",
    background: "bg-[#ffe7ef]",
    face: "bg-[#f0b28a]",
    accent: "bg-party-blue",
    icon: CakeSlice
  }
};

export function getAvatarPresetLabel(presetId: AvatarPresetId) {
  return presetMeta[presetId].label;
}

export function PresetAvatar({
  presetId,
  className
}: {
  presetId: AvatarPresetId;
  className?: string;
}) {
  const meta = presetMeta[presetId];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden rounded-full border border-party-blue-deep/20 shadow-lift",
        meta.background,
        className
      )}
      aria-hidden="true"
    >
      <span className="absolute -left-2 top-3 h-5 w-5 rounded-full bg-party-blue/25" />
      <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-party-orange/25" />
      <span className={cn("relative h-[64%] w-[64%] rounded-full shadow-outline", meta.face)}>
        <span className="absolute left-[20%] top-[34%] h-[13%] w-[13%] rounded-full bg-foreground/75" />
        <span className="absolute right-[20%] top-[34%] h-[13%] w-[13%] rounded-full bg-foreground/75" />
        <span className="absolute left-1/2 top-[52%] h-[10%] w-[14%] -translate-x-1/2 rounded-full bg-foreground/45" />
      </span>
      <span
        className={cn(
          "absolute right-[16%] top-[10%] grid h-[34%] w-[34%] place-items-center rounded-[0.55rem] border border-white/60 text-primary-foreground shadow-sticker",
          meta.accent
        )}
      >
        <Icon className="h-[58%] w-[58%]" aria-hidden="true" />
      </span>
    </div>
  );
}

export function ParticipantAvatar({
  avatar,
  displayName,
  size = "md",
  className
}: ParticipantAvatarProps) {
  const resolved = avatar ?? fallbackAvatar(displayName);
  const label = displayName || undefined;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-2 border-surface-paper bg-surface-highlight font-display font-extrabold text-foreground shadow-lift",
        sizeClasses[size],
        className
      )}
      aria-label={label}
      title={label}
    >
      {resolved.type === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved.url} alt="" className="h-full w-full object-cover" />
      ) : null}
      {resolved.type === "preset" ? <PresetAvatar presetId={resolved.presetId} /> : null}
      {resolved.type === "fallback" ? (
        <div className="grid h-full w-full place-items-center bg-surface-sky text-party-blue-deep">
          {resolved.initials}
        </div>
      ) : null}
    </div>
  );
}

export { avatarPresetIds };
