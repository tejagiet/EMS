"use client";

import { Bell, CheckCheck, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRealtime } from "@/src/context/RealtimeContext";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "info" | "success" | "warning" | "error";
  link?: string;
}

export interface NotificationPanelProps {
  notifications?: NotificationItem[];
}

export function NotificationPanel({
  notifications: initialNotifications = [],
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  useRealtime({
    onUpdate: (event) => {
      if (event.message) {
        setNotifications((prev) => [
          {
            id: `live-${Date.now()}-${Math.random()}`,
            title: event.table
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            message: event.message || "Status updated in real-time.",
            timestamp: "Just now",
            isRead: false,
            type: "info",
          },
          ...prev,
        ]);
      }
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="btn btn-secondary btn-sm"
        style={{
          position: "relative",
          padding: "6px 10px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Notifications"
        aria-label={`Notifications, ${unreadCount.toString()} unread`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              backgroundColor: "var(--danger)",
              color: "#ffffff",
              fontSize: "0.65rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--header-bg)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Overlay to close on outside click */}
          <div
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 49,
            }}
          />

          <div
            className="card"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: 340,
              maxHeight: 440,
              overflowY: "auto",
              padding: 0,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
              zIndex: 50,
              borderRadius: 10,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                <Bell size={24} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                <p style={{ margin: 0 }}>No notifications at this time</p>
              </div>
            ) : (
              <div>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: item.isRead ? "transparent" : "rgba(30, 58, 138, 0.04)",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: item.isRead ? 600 : 700,
                          fontSize: "0.84rem",
                          color: "var(--text-main)",
                        }}
                      >
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "var(--secondary)",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        margin: "0 0 6px",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} />
                        {item.timestamp}
                      </span>

                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                        >
                          View <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
