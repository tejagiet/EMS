"use client";

import { Moon, Sun } from "lucide-react";
import React from "react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme();
      }}
      className={`btn btn-secondary btn-sm ${className}`}
      style={{
        padding: "6px 10px",
        borderRadius: "8px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Toggle theme, current is ${theme}`}
    >
      {theme === "light" ? (
        <>
          <Moon size={16} />
          <span style={{ fontSize: "0.78rem" }}>Dark</span>
        </>
      ) : (
        <>
          <Sun size={16} />
          <span style={{ fontSize: "0.78rem" }}>Light</span>
        </>
      )}
    </button>
  );
}
