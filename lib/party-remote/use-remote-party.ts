"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import type {
  RemoteApiError,
  RemoteConnectionState,
  RemoteGuestSnapshot,
  RemoteNoSessionSnapshot,
  RemotePartySnapshot
} from "./types";

type RemoteSnapshotState<TSnapshot> = {
  snapshot: TSnapshot | null;
  connection: RemoteConnectionState;
  error: RemoteApiError | null;
  refresh: () => Promise<void>;
  applySnapshot: (snapshot: TSnapshot) => void;
};

export type RemoteSnapshotTrackingState = {
  sessionId: string | null;
  revision: number;
};

type TrackableRemoteSnapshot = {
  session: {
    id: string;
    revision: number;
  } | null;
};

export function resolveRemoteSnapshotTracking(
  current: RemoteSnapshotTrackingState,
  nextSnapshot: TrackableRemoteSnapshot
): { accept: boolean; next: RemoteSnapshotTrackingState } {
  const nextSessionId = nextSnapshot.session?.id ?? null;
  const nextRevision = nextSnapshot.session?.revision ?? -1;

  if (nextSessionId !== current.sessionId) {
    return {
      accept: true,
      next: {
        sessionId: nextSessionId,
        revision: nextRevision
      }
    };
  }

  if (!nextSnapshot.session) {
    return {
      accept: true,
      next: {
        sessionId: null,
        revision: -1
      }
    };
  }

  if (nextRevision < current.revision) {
    return {
      accept: false,
      next: current
    };
  }

  return {
    accept: true,
    next: {
      sessionId: nextSessionId,
      revision: nextRevision
    }
  };
}

function isRemoteGuestSnapshot(
  snapshot: RemotePartySnapshot | RemoteGuestSnapshot
): snapshot is RemoteGuestSnapshot {
  return "guest" in snapshot;
}

export function useRemotePartySnapshot<
  TSnapshot extends RemotePartySnapshot | RemoteGuestSnapshot | RemoteNoSessionSnapshot
>(
  includeGuest: boolean
): RemoteSnapshotState<TSnapshot> {
  const [snapshot, setSnapshot] = useState<TSnapshot | null>(null);
  const [connection, setConnection] = useState<RemoteConnectionState>("connecting");
  const [error, setError] = useState<RemoteApiError | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const revisionRef = useRef(-1);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const reconnectGraceTimerRef = useRef<number | null>(null);
  const offlineGraceTimerRef = useRef<number | null>(null);

  const clearReconnectGrace = useCallback(() => {
    if (reconnectGraceTimerRef.current !== null) {
      window.clearTimeout(reconnectGraceTimerRef.current);
      reconnectGraceTimerRef.current = null;
    }
  }, []);

  const clearOfflineGrace = useCallback(() => {
    if (offlineGraceTimerRef.current !== null) {
      window.clearTimeout(offlineGraceTimerRef.current);
      offlineGraceTimerRef.current = null;
    }
  }, []);

  const settleLive = useCallback(() => {
    clearReconnectGrace();
    clearOfflineGrace();
    setConnection("connected");
  }, [clearOfflineGrace, clearReconnectGrace]);

  const markReconnectingSoon = useCallback(() => {
    if (reconnectGraceTimerRef.current !== null) {
      return;
    }

    reconnectGraceTimerRef.current = window.setTimeout(() => {
      reconnectGraceTimerRef.current = null;
      setConnection((current) =>
        current === "connected" || current === "reconnecting" ? "reconnecting" : current
      );
    }, 700);
  }, []);

  const markOfflineSoon = useCallback(() => {
    clearReconnectGrace();

    if (offlineGraceTimerRef.current !== null) {
      return;
    }

    offlineGraceTimerRef.current = window.setTimeout(() => {
      offlineGraceTimerRef.current = null;
      setConnection(window.navigator.onLine ? "reconnecting" : "offline");
    }, 900);
  }, [clearReconnectGrace]);

  const applySnapshot = useCallback((nextSnapshot: TSnapshot) => {
    const tracking = resolveRemoteSnapshotTracking(
      {
        sessionId: currentSessionIdRef.current,
        revision: revisionRef.current
      },
      nextSnapshot
    );

    if (!tracking.accept) {
      return;
    }

    currentSessionIdRef.current = tracking.next.sessionId;
    revisionRef.current = tracking.next.revision;
    setSnapshot({
      ...nextSnapshot,
      connection: "connected"
    });
    settleLive();
    setError(null);
  }, [settleLive]);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshPromise = (async () => {
      setConnection((current) => {
        if (current === "connecting" || current === "offline" || current === "error") {
          return current;
        }

        return current;
      });
      markReconnectingSoon();

      try {
        const response = await fetch("/api/party/session", {
          headers: {
            accept: "application/json"
          },
          cache: "no-store"
        });
        const payload = await response.json();

        if (!response.ok) {
          clearReconnectGrace();
          setConnection("error");
          setError(payload.error ?? {
            code: "temporary_server_failure",
            message: "Could not refresh the party state."
          });
          return;
        }

        if (includeGuest && payload.session && !isRemoteGuestSnapshot(payload)) {
          markReconnectingSoon();
        }

        applySnapshot(payload as TSnapshot);
      } catch {
        markOfflineSoon();
        setError({
          code: "temporary_server_failure",
          message: "Connection paused. Trying to reconnect."
        });
      }
    })();

    refreshInFlightRef.current = refreshPromise;

    try {
      await refreshPromise;
    } finally {
      if (refreshInFlightRef.current === refreshPromise) {
        refreshInFlightRef.current = null;
      }
    }
  }, [applySnapshot, clearReconnectGrace, includeGuest, markOfflineSoon, markReconnectingSoon]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, connection === "connected" ? 8000 : 3000);

    return () => window.clearInterval(interval);
  }, [connection, refresh]);

  useEffect(() => {
    const online = () => void refresh();
    const offline = () => markOfflineSoon();

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [markOfflineSoon, refresh]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    const sessionId = snapshot?.session?.id;

    if (!client || !sessionId) {
      return;
    }

    const channel = client
      .channel(`party-session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_sessions",
          filter: `id=eq.${sessionId}`
        },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `party_session_id=eq.${sessionId}`
        },
        () => {
          void refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          settleLive();
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          markReconnectingSoon();
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [markReconnectingSoon, refresh, settleLive, snapshot?.session?.id]);

  useEffect(
    () => () => {
      clearReconnectGrace();
      clearOfflineGrace();
    },
    [clearOfflineGrace, clearReconnectGrace]
  );

  return {
    snapshot,
    connection,
    error,
    refresh,
    applySnapshot
  };
}
