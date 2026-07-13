"use client";

import { AlertCircle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import type { PartyUiCopy } from "@/lib/party-runtime/copy";
import type { RemoteConnectionState } from "@/lib/party-remote/types";

function connectionTone(connection: RemoteConnectionState) {
  if (connection === "connected") {
    return "blue" as const;
  }

  if (connection === "offline" || connection === "error") {
    return "coral" as const;
  }

  return "yellow" as const;
}

function ConnectionIcon({ connection }: { connection: RemoteConnectionState }) {
  if (connection === "connected") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (connection === "offline") {
    return <WifiOff className="h-4 w-4" aria-hidden="true" />;
  }

  if (connection === "error") {
    return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
  }

  return (
    <RefreshCw
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}

export function ConnectionStatusBadge({
  connection,
  copy,
  prefix = false
}: {
  connection: RemoteConnectionState;
  copy: PartyUiCopy;
  prefix?: boolean;
}) {
  const label = copy[connection];
  const accessibleLabel = prefix ? `${copy.connection}: ${label}` : label;

  return (
    <BirthdayBadge tone={connectionTone(connection)}>
      <ConnectionIcon connection={connection} />
      <span aria-label={accessibleLabel}>{prefix ? `${copy.connection}: ${label}` : label}</span>
    </BirthdayBadge>
  );
}
