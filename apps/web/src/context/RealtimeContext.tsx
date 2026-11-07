import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/Toast";

export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface RealtimeEventPayload {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE" | "BROADCAST";
  record?: any;
  oldRecord?: any;
  message?: string;
  timestamp: string;
}

export interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  isConnected: boolean;
  lastEvent: RealtimeEventPayload | null;
  broadcastChange: (event: {
    table: string;
    eventType?: "INSERT" | "UPDATE" | "DELETE" | "BROADCAST";
    record?: any;
    message?: string;
  }) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

interface RealtimeProviderProps {
  children: React.ReactNode;
  orgId?: string;
}

const MONITORED_TABLES = [
  "attendance_records",
  "leave_requests",
  "leave_balances",
  "candidates",
  "job_offers",
  "assets",
  "asset_assignments",
  "announcements",
  "employees",
  "documents",
  "payroll_runs",
  "shifts",
];

export function RealtimeProvider({ children, orgId }: RealtimeProviderProps) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const toastCtx = useToast();

  const handleIncomingChange = useCallback(
    (eventPayload: RealtimeEventPayload) => {
      setLastEvent(eventPayload);

      // Dispatch browser custom events for active SPA views
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ems:realtime_update", {
            detail: eventPayload,
          })
        );
        window.dispatchEvent(
          new CustomEvent("ems:refresh", {
            detail: eventPayload,
          })
        );
      }

      // User feedback on critical background events
      if (eventPayload.message && toastCtx?.showToast) {
        toastCtx.showToast({
          title: "Live System Update",
          message: eventPayload.message,
          type: "info",
        });
      }
    },
    [toastCtx]
  );

  useEffect(() => {
    const supabase = createClient();
    const channelName = `ems_channel_${orgId || "platform"}`;

    setStatus("connecting");

    const channel = supabase.channel(channelName);

    // 1. Listen to PostgreSQL changes on monitored EMS business tables
    MONITORED_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload: any) => {
          const detail: RealtimeEventPayload = {
            table: payload.table || table,
            eventType: payload.eventType || "UPDATE",
            record: payload.new,
            oldRecord: payload.old,
            timestamp: new Date().toISOString(),
          };
          handleIncomingChange(detail);
        }
      );
    });

    // 2. Listen to cross-client broadcast messages
    channel.on(
      "broadcast",
      { event: "ems:status_update" },
      (message: any) => {
        const payload = message.payload as RealtimeEventPayload;
        if (payload) {
          handleIncomingChange(payload);
        }
      }
    );

    // 3. Subscribe to Realtime WebSocket channel
    channel.subscribe((channelStatus, err) => {
      if (channelStatus === "SUBSCRIBED") {
        setStatus("connected");
      } else if (channelStatus === "CLOSED") {
        setStatus("disconnected");
      } else if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
        setStatus("error");
        console.warn("[RealtimeProvider] Channel warning:", channelStatus, err);
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [orgId, handleIncomingChange]);

  const broadcastChange = useCallback(
    async (event: {
      table: string;
      eventType?: "INSERT" | "UPDATE" | "DELETE" | "BROADCAST";
      record?: any;
      message?: string;
    }) => {
      const payload: RealtimeEventPayload = {
        table: event.table,
        eventType: event.eventType || "UPDATE",
        record: event.record,
        message: event.message,
        timestamp: new Date().toISOString(),
      };

      // 1. Local window notification
      handleIncomingChange(payload);

      // 2. Cross-client WebSocket broadcast via active channel
      if (channelRef.current && status === "connected") {
        try {
          await channelRef.current.send({
            type: "broadcast",
            event: "ems:status_update",
            payload,
          });
        } catch (err) {
          console.warn("[RealtimeProvider] Broadcast delivery failed:", err);
        }
      }
    },
    [handleIncomingChange, status]
  );

  return (
    <RealtimeContext.Provider
      value={{
        status,
        isConnected: status === "connected",
        lastEvent,
        broadcastChange,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(options?: {
  table?: string;
  onUpdate?: (event: RealtimeEventPayload) => void;
}) {
  const context = useContext(RealtimeContext);
  const onUpdateRef = useRef(options?.onUpdate);
  onUpdateRef.current = options?.onUpdate;

  useEffect(() => {
    if (!options?.table && !options?.onUpdate) return;

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<RealtimeEventPayload>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (!options?.table || detail.table === options.table) {
        if (onUpdateRef.current) {
          onUpdateRef.current(detail);
        }
      }
    };

    window.addEventListener("ems:realtime_update", handler);
    return () => {
      window.removeEventListener("ems:realtime_update", handler);
    };
  }, [options?.table]);

  if (!context) {
    return {
      status: "disconnected" as RealtimeConnectionStatus,
      isConnected: false,
      lastEvent: null,
      broadcastChange: async () => {},
    };
  }

  return context;
}
