"use client";

import React, { createContext, useContext, useState } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  defaultTab,
  children,
  className = "",
  onChange,
}: {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`tabs-container ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`tabs-list ${className}`}
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        gap: 8,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

export function TabTrigger({
  id,
  children,
  badge,
  icon,
}: {
  id: string;
  children: React.ReactNode;
  badge?: number | string;
  icon?: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be inside Tabs");

  const isActive = context.activeTab === id;

  return (
    <button
      type="button"
      onClick={() => {
        context.setActiveTab(id);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        fontSize: "0.88rem",
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--primary)" : "var(--text-muted)",
        border: "none",
        borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
        backgroundColor: "transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: -1,
      }}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span
          className={`badge ${isActive ? "badge-primary" : "badge-neutral"}`}
          style={{ fontSize: "0.7rem", padding: "1px 6px" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function TabContent({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabContent must be inside Tabs");

  if (context.activeTab !== id) return null;

  return <div className={`tab-content ${className}`}>{children}</div>;
}
