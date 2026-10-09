/**
 * @ems/ui — Shared UI primitives, design system tokens and interfaces for EMS
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

export const INSTITUTIONAL_METADATA = {
  institutionName: "GIET Polytechnic College",
  departmentName: "Artificial Intelligence (AI) Department",
  batch: "2024–2027",
  projectName: "Employee Management System (EMS)",
  team: "Team T-1",
  projectCategory: "Industrial Training Project",
  publisherId: "GIETP-AI-IT-EMS-T1-2026",
  version: "1.0.0",
} as const;

export const THEME_COLORS_LIGHT = {
  primary: "#1e3a8a", // GIET Institutional Navy
  primaryHover: "#172554",
  secondary: "#0284c7", // Tech Sky Blue
  accent: "#f59e0b", // Amber Accent
  background: "#f8fafc",
  card: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#64748b",
  border: "#e2e8f0",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  sidebarBg: "#ffffff",
  headerBg: "#ffffff",
} as const;

export const THEME_COLORS_DARK = {
  primary: "#3b82f6", // Vibrant Blue in dark mode
  primaryHover: "#2563eb",
  secondary: "#38bdf8",
  accent: "#fbbf24",
  background: "#0f172a",
  card: "#1e293b",
  textPrimary: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  border: "#334155",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  sidebarBg: "#1e293b",
  headerBg: "#1e293b",
} as const;

export const THEME_COLORS = THEME_COLORS_LIGHT;

export const SPACING_SCALE = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
} as const;

export const BORDER_RADII = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export type ThemeMode = "light" | "dark" | "system";

export interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export interface InstitutionalHeaderProps {
  institutionName?: string;
  departmentName?: string;
  projectName?: string;
  team?: string;
  publisherId?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "info" | "success" | "warning" | "error";
  link?: string;
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  durationMs?: number;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    isPositive?: boolean;
  };
  comparisonPeriod?: string;
  isLoading?: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
  requiredPhase?: number;
  drillDownHref?: string;
  iconName?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export interface DistributionDataPoint {
  category: string;
  count: number;
  percentage?: number;
  color?: string;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  label?: string;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => unknown;
  width?: string;
  align?: "left" | "center" | "right";
}
