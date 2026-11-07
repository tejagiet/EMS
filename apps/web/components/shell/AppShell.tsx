"use client";

import { signOutAction, switchOrganizationAction, switchRoleAction } from "@/lib/auth/actions";
import {
  filterNavigationByPermissions,
  PORTAL_CONFIGS,
  PORTAL_ROLE_DEFINITIONS,
} from "@ems/config";
import { getInitials } from "@ems/shared";
import type { AuthenticatedUserContext, PortalRole } from "@ems/types";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  CreditCard,
  FileCheck,
  FileText,
  FolderDown,
  History,
  Home,
  Key,
  Laptop,
  Lock,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Settings,
  Sliders,
  Unlock,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Breadcrumbs } from "../ui/Breadcrumbs";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";
import { useRealtime } from "@/src/context/RealtimeContext";

interface AppShellProps {
  context: AuthenticatedUserContext;
  children: React.ReactNode;
}

export function AppShell({ context, children }: AppShellProps) {
  const pathname = usePathname();
  const { isConnected, status: realtimeStatus } = useRealtime();
  const [isSidebarLocked, setIsSidebarLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ems_sidebar_layout_locked");
      return saved === null ? true : saved === "true";
    }
    return true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const locked = localStorage.getItem("ems_sidebar_layout_locked");
      if (locked === null || locked === "true") return false;
      return localStorage.getItem("ems_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleSidebarLock = () => {
    const nextLocked = !isSidebarLocked;
    setIsSidebarLocked(nextLocked);
    if (typeof window !== "undefined") {
      localStorage.setItem("ems_sidebar_layout_locked", String(nextLocked));
    }
    if (nextLocked) {
      setSidebarCollapsed(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("ems_sidebar_collapsed", "false");
      }
    }
  };

  const handleToggleCollapse = () => {
    if (isSidebarLocked) {
      setIsSidebarLocked(false);
      setSidebarCollapsed(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("ems_sidebar_layout_locked", "false");
        localStorage.setItem("ems_sidebar_collapsed", "true");
      }
    } else {
      const nextCollapsed = !sidebarCollapsed;
      setSidebarCollapsed(nextCollapsed);
      if (typeof window !== "undefined") {
        localStorage.setItem("ems_sidebar_collapsed", String(nextCollapsed));
      }
    }
  };

  const activeRole = context.activeRole;
  const config = PORTAL_CONFIGS[activeRole];
  const roleDef = PORTAL_ROLE_DEFINITIONS[activeRole];
  const navigation = filterNavigationByPermissions(config.navigation, context.permissions);

  const getNavIcon = (id: string) => {
    switch (id) {
      case "dashboard":
      case "overview":
      case "super_overview":
      case "org_overview":
      case "hr_overview":
      case "recruitment_overview":
      case "finance_overview":
      case "manager_overview":
      case "dept_overview":
      case "it_overview":
      case "employee_overview":
      case "auditor_overview":
        return <Home size={18} />;
      case "employees":
      case "members":
      case "org_employees":
      case "team_members":
      case "dept_members":
      case "my-team":
      case "department-staff":
        return <Users size={18} />;
      case "organizations":
      case "org_structure":
      case "branches":
      case "departments":
      case "designations":
        return <Building2 size={18} />;
      case "roles":
        return <Key size={18} />;
      case "policies":
        return <Sliders size={18} />;
      case "settings":
        return <Settings size={18} />;
      case "payroll":
      case "compensation":
      case "salary-structures":
      case "payroll-runs":
      case "tax-reports":
      case "payroll-audit":
        return <PieChart size={18} />;
      case "payslips":
        return <CreditCard size={18} />;
      case "approvals":
        return <CheckSquare size={18} />;
      case "recruitment":
      case "job_postings":
      case "openings":
      case "candidates":
      case "onboarding":
      case "offboarding":
      case "performance":
        return <UserCheck size={18} />;
      case "attendance":
      case "team_attendance":
      case "my_attendance":
        return <FileCheck size={18} />;
      case "shifts":
        return <Calendar size={18} />;
      case "leave":
      case "leaves":
      case "team_leaves":
      case "my_leaves":
      case "dept-leave":
        return <Briefcase size={18} />;
      case "assets":
      case "it_inventory":
      case "inventory":
      case "allocations":
      case "dept-assets":
        return <Laptop size={18} />;
      case "maintenance":
        return <Wrench size={18} />;
      case "documents":
      case "my_documents":
        return <FileText size={18} />;
      case "announcements":
        return <Bell size={18} />;
      case "import_export":
        return <FolderDown size={18} />;
      case "audit":
      case "audit_logs":
      case "audit_reports":
      case "logs":
      case "employee-changes":
        return <History size={18} />;
      default:
        return <Home size={18} />;
    }
  };

  const breadcrumbItems = [
    { label: "Portals", href: "/portal" },
    { label: roleDef.name, href: config.basePath, isCurrent: true },
  ];

  return (
    <div className="app-shell">
      {/* Top Navigation Header */}
      <header className="shell-header">
        <div className="shell-brand">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="btn btn-ghost btn-sm md:hidden"
            style={{ padding: 6 }}
            aria-label="Toggle mobile menu"
          >
            <Menu size={20} />
          </button>

          {/* Side panel lock & collapse controls */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="btn btn-ghost btn-sm"
              style={{ padding: 6 }}
              title={sidebarCollapsed ? "Expand side panel" : "Collapse side panel"}
              aria-label="Toggle side panel collapse"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              type="button"
              onClick={toggleSidebarLock}
              className="btn btn-ghost btn-sm"
              style={{
                padding: 6,
                color: isSidebarLocked ? "var(--primary)" : "var(--text-muted)",
                backgroundColor: isSidebarLocked ? "rgba(30, 58, 138, 0.1)" : "transparent",
              }}
              title={
                isSidebarLocked
                  ? "Side panel layout is locked in open position. Click to unlock."
                  : "Lock side panel layout in open position."
              }
              aria-label="Lock side panel layout"
            >
              {isSidebarLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>

          <Link href="/portal" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/logo.jpg"
              alt="EMS Logo"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                objectFit: "cover",
              }}
            />
            <h2>EMS Portal</h2>
          </Link>

          <span
            className="badge badge-primary hidden sm:inline-flex"
            style={{ fontSize: "0.74rem" }}
          >
            {roleDef.name}
          </span>

          {/* Realtime Live Updates Status Pill */}
          <div
            className={`realtime-status-pill ${
              isConnected ? "online" : realtimeStatus === "connecting" ? "connecting" : "offline"
            }`}
            title={
              isConnected
                ? "Real-time sync active: Live status updates across portals"
                : realtimeStatus === "connecting"
                ? "Connecting to live Supabase channel..."
                : "Real-time updates disconnected"
            }
          >
            <span className="realtime-pulse-dot" />
            <span className="realtime-status-text hidden sm:inline">
              {isConnected ? "Live" : realtimeStatus === "connecting" ? "Connecting" : "Offline"}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div
          className="shell-header-actions"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          {/* Organization Switcher (Only if user has multiple authorized memberships) */}
          {context.memberships.length > 1 ? (
            <form
              action={switchOrganizationAction}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <select
                name="organizationId"
                defaultValue={context.activeOrganization?.id}
                className="switcher-select"
                style={{ fontSize: "0.8rem", height: 34 }}
              >
                {context.memberships.map((m) => (
                  <option key={m.organizationId} value={m.organizationId}>
                    {m.organizationName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ height: 34, padding: "0 8px" }}
              >
                Switch
              </button>
            </form>
          ) : (
            <div
              className="hidden lg:flex"
              style={{
                alignItems: "center",
                gap: 6,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              <Building2 size={14} />
              <span>{context.activeOrganization?.name ?? "Global Platform"}</span>
            </div>
          )}

          {/* Role Switcher (if user holds multiple roles) */}
          {context.availableRoles.length > 1 && (
            <form
              action={switchRoleAction}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
              className="hidden md:flex"
            >
              <select
                name="roleCode"
                defaultValue={context.activeRole}
                className="switcher-select"
                style={{ fontSize: "0.8rem", height: 34 }}
              >
                {context.availableRoles.map((role: PortalRole) => (
                  <option key={role} value={role}>
                    {PORTAL_ROLE_DEFINITIONS[role].name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ height: 34, padding: "0 8px" }}
              >
                Switch
              </button>
            </form>
          )}

          {/* Notification Panel */}
          <NotificationPanel
            notifications={[
              {
                id: "notif-1",
                title: "Welcome to EMS Phase 4",
                message: "Dashboard and Design System UI is now operational.",
                timestamp: "Just now",
                isRead: false,
                type: "info",
                link: config.basePath,
              },
              {
                id: "notif-2",
                title: "Institutional Context",
                message: `Active Tenant: ${context.activeOrganization?.name ?? "GIET Polytechnic College"}`,
                timestamp: "Today",
                isRead: true,
                type: "success",
              },
            ]}
          />

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 8,
              }}
              aria-label="User profile menu"
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                {getInitials(context.profile.fullName)}
              </div>
              <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  onClick={() => {
                    setUserDropdownOpen(false);
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
                    width: 240,
                    padding: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--border)",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                      {context.profile.fullName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        wordBreak: "break-all",
                      }}
                    >
                      {context.email}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-secondary" style={{ fontSize: "0.68rem" }}>
                        {roleDef.name}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Link
                      href="/portal"
                      onClick={() => {
                        setUserDropdownOpen(false);
                      }}
                      className="nav-link"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                    >
                      <User size={14} style={{ marginRight: 6 }} /> Switch Portal
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => {
                        setUserDropdownOpen(false);
                      }}
                      className="nav-link"
                      style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                    >
                      <Building2 size={14} style={{ marginRight: 6 }} /> About Project
                    </Link>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      marginTop: 8,
                      paddingTop: 8,
                    }}
                  >
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          color: "var(--danger)",
                        }}
                      >
                        <LogOut size={14} style={{ marginRight: 6 }} /> Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Shell Body with Sidebar and Main Content */}
      <div className="shell-body">
        {/* Desktop & Mobile Drawer Sidebar */}
        <aside
          className={`shell-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${
            isSidebarLocked ? "locked" : ""
          } ${mobileMenuOpen ? "mobile-open" : ""}`}
        >
          <div className="sidebar-nav">
            {!sidebarCollapsed && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 10px 8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={toggleSidebarLock}
                  title={
                    isSidebarLocked
                      ? "Side panel is locked in place. Click to unlock."
                      : "Lock side panel in open position."
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: isSidebarLocked ? "rgba(30, 58, 138, 0.12)" : "rgba(100, 116, 139, 0.1)",
                    color: isSidebarLocked ? "var(--primary)" : "var(--text-muted)",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isSidebarLocked ? <Lock size={11} /> : <Unlock size={11} />}
                  <span>{isSidebarLocked ? "Locked" : "Lock"}</span>
                </button>
              </div>
            )}

            {navigation.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="icon">{getNavIcon(item.id)}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </aside>

        {mobileMenuOpen && (
          <button
            type="button"
            className="shell-mobile-backdrop"
            onClick={() => {
              setMobileMenuOpen(false);
            }}
            aria-label="Close navigation menu"
          />
        )}

        {/* Main Content Area */}
        <main className="shell-content">
          <Breadcrumbs items={breadcrumbItems} />
          {children}
        </main>
      </div>
    </div>
  );
}
