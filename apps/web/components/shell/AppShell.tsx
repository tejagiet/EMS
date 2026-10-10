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
  Briefcase,
  Building2,
  ChevronDown,
  FileCheck,
  FileText,
  History,
  Home,
  Key,
  Laptop,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Sliders,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Breadcrumbs } from "../ui/Breadcrumbs";
import { InstitutionalFooter } from "../ui/InstitutionalHeader";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";

interface AppShellProps {
  context: AuthenticatedUserContext;
  children: React.ReactNode;
}

export function AppShell({ context, children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
        return <Users size={18} />;
      case "organizations":
      case "org_structure":
      case "branches":
        return <Building2 size={18} />;
      case "departments":
        return <Building2 size={18} />;
      case "roles":
        return <Key size={18} />;
      case "policies":
        return <Sliders size={18} />;
      case "payroll":
      case "compensation":
        return <PieChart size={18} />;
      case "recruitment":
      case "job_postings":
      case "candidates":
        return <UserCheck size={18} />;
      case "attendance":
      case "team_attendance":
      case "my_attendance":
        return <FileCheck size={18} />;
      case "leaves":
      case "team_leaves":
      case "my_leaves":
        return <Briefcase size={18} />;
      case "assets":
      case "it_inventory":
        return <Laptop size={18} />;
      case "documents":
      case "my_documents":
        return <FileText size={18} />;
      case "audit":
      case "audit_logs":
      case "audit_reports":
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

          {/* Desktop sidebar collapse toggle */}
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
            }}
            className="btn btn-ghost btn-sm hidden md:flex"
            style={{ padding: 6 }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <Link href="/portal" style={{ textDecoration: "none", color: "inherit" }}>
            <h2>EMS Portal</h2>
          </Link>

          <span
            className="badge badge-primary hidden sm:inline-flex"
            style={{ fontSize: "0.74rem" }}
          >
            {roleDef.name}
          </span>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            mobileMenuOpen ? "mobile-open" : ""
          }`}
        >
          <div className="sidebar-nav">
            {!sidebarCollapsed && (
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: "4px 10px 8px",
                }}
              >
                Navigation
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

          {!sidebarCollapsed && (
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid var(--sidebar-border)",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
              }}
            >
              <div>GIET Polytechnic College</div>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>AI Dept · Team T-1</div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="shell-content">
          <Breadcrumbs items={breadcrumbItems} />
          {children}
        </main>
      </div>

      {/* Institutional Footer */}
      <InstitutionalFooter />
    </div>
  );
}
