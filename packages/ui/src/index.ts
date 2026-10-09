/**
 * @ems/ui — Shared UI primitives and styling tokens for EMS
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

export const THEME_COLORS = {
  primary: "#1e3a8a", // GIET Institutional Navy
  primaryHover: "#172554",
  secondary: "#0284c7", // Tech Sky Blue
  accent: "#f59e0b", // Amber Accent
  background: "#f8fafc",
  card: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
}

export interface InstitutionalHeaderProps {
  institutionName?: string;
  departmentName?: string;
  projectName?: string;
  team?: string;
  publisherId?: string;
}
