import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PortalLayout } from "./components/PortalLayout";
import { AsyncPage } from "./components/AsyncPage";
import { AuthCallback } from "./pages/AuthCallback";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication & Info Pages */}
          <Route path="/" element={<AsyncPage loader={() => import("@/app/page")} />} />
          <Route path="/login" element={<AsyncPage loader={() => import("@/app/login/page")} />} />
          <Route path="/signup" element={<AsyncPage loader={() => import("@/app/signup/page")} />} />
          <Route
            path="/forgot-password"
            element={<AsyncPage loader={() => import("@/app/forgot-password/page")} />}
          />
          <Route
            path="/auth/reset-password"
            element={<AsyncPage loader={() => import("@/app/auth/reset-password/page")} />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/unauthorized"
            element={<AsyncPage loader={() => import("@/app/unauthorized/page")} />}
          />
          <Route path="/about" element={<AsyncPage loader={() => import("@/app/about/page")} />} />
          <Route
            path="/downloads"
            element={<AsyncPage loader={() => import("@/app/downloads/page")} />}
          />
          <Route
            path="/download"
            element={<AsyncPage loader={() => import("@/app/downloads/page")} />}
          />
          <Route
            path="/access-pending"
            element={<AsyncPage loader={() => import("@/app/unauthorized/page")} />}
          />

          {/* Portal Switcher & Landing */}
          <Route
            path="/portal"
            element={<AsyncPage loader={() => import("@/app/portal/page")} />}
          />

          {/* Authenticated Portal Routes wrapped with AppShell */}
          <Route path="/portal" element={<PortalLayout />}>
            {/* Super Admin */}
            <Route
              path="super-admin"
              element={<AsyncPage loader={() => import("@/app/portal/super-admin/page")} />}
            />
            <Route
              path="super-admin/audit"
              element={<AsyncPage loader={() => import("@/app/portal/super-admin/audit/page")} />}
            />
            <Route
              path="super-admin/organizations"
              element={
                <AsyncPage loader={() => import("@/app/portal/super-admin/organizations/page")} />
              }
            />
            <Route
              path="super-admin/roles"
              element={<AsyncPage loader={() => import("@/app/portal/super-admin/roles/page")} />}
            />
            <Route
              path="super-admin/settings"
              element={<AsyncPage loader={() => import("@/app/portal/super-admin/settings/page")} />}
            />

            {/* Org Admin */}
            <Route
              path="org-admin"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/page")} />}
            />
            <Route
              path="org-admin/audit"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/audit/page")} />}
            />
            <Route
              path="org-admin/branches"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/branches/page")} />}
            />
            <Route
              path="org-admin/departments"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/departments/page")} />}
            />
            <Route
              path="org-admin/members"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/members/page")} />}
            />
            <Route
              path="org-admin/policies"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/policies/page")} />}
            />
            <Route
              path="org-admin/roles"
              element={<AsyncPage loader={() => import("@/app/portal/org-admin/roles/page")} />}
            />

            {/* Human Resources (HR) */}
            <Route
              path="hr"
              element={<AsyncPage loader={() => import("@/app/portal/hr/page")} />}
            />
            <Route
              path="hr/announcements"
              element={<AsyncPage loader={() => import("@/app/portal/hr/announcements/page")} />}
            />
            <Route
              path="hr/attendance"
              element={<AsyncPage loader={() => import("@/app/portal/hr/attendance/page")} />}
            />
            <Route
              path="hr/branches"
              element={<AsyncPage loader={() => import("@/app/portal/hr/branches/page")} />}
            />
            <Route
              path="hr/departments"
              element={<AsyncPage loader={() => import("@/app/portal/hr/departments/page")} />}
            />
            <Route
              path="hr/designations"
              element={<AsyncPage loader={() => import("@/app/portal/hr/designations/page")} />}
            />
            <Route
              path="hr/documents"
              element={<AsyncPage loader={() => import("@/app/portal/hr/documents/page")} />}
            />
            <Route
              path="hr/employees"
              element={<AsyncPage loader={() => import("@/app/portal/hr/employees/page")} />}
            />
            <Route
              path="hr/employees/new"
              element={<AsyncPage loader={() => import("@/app/portal/hr/employees/new/page")} />}
            />
            <Route
              path="hr/employees/:id"
              element={<AsyncPage loader={() => import("@/app/portal/hr/employees/[id]/page")} />}
            />
            <Route
              path="hr/employees/:id/edit"
              element={<AsyncPage loader={() => import("@/app/portal/hr/employees/[id]/edit/page")} />}
            />
            <Route
              path="hr/import-export"
              element={<AsyncPage loader={() => import("@/app/portal/hr/import-export/page")} />}
            />
            <Route
              path="hr/leave"
              element={<AsyncPage loader={() => import("@/app/portal/hr/leave/page")} />}
            />
            <Route
              path="hr/offboarding"
              element={<AsyncPage loader={() => import("@/app/portal/hr/offboarding/page")} />}
            />
            <Route
              path="hr/onboarding"
              element={<AsyncPage loader={() => import("@/app/portal/hr/onboarding/page")} />}
            />
            <Route
              path="hr/performance"
              element={<AsyncPage loader={() => import("@/app/portal/hr/performance/page")} />}
            />
            <Route
              path="hr/shifts"
              element={<AsyncPage loader={() => import("@/app/portal/hr/shifts/page")} />}
            />

            {/* Recruitment */}
            <Route
              path="recruitment"
              element={<AsyncPage loader={() => import("@/app/portal/recruitment/page")} />}
            />
            <Route
              path="recruitment/candidates"
              element={<AsyncPage loader={() => import("@/app/portal/recruitment/candidates/page")} />}
            />
            <Route
              path="recruitment/candidates/:id"
              element={
                <AsyncPage
                  loader={() => import("@/app/portal/recruitment/candidates/[id]/page")}
                />
              }
            />
            <Route
              path="recruitment/onboarding"
              element={<AsyncPage loader={() => import("@/app/portal/recruitment/onboarding/page")} />}
            />
            <Route
              path="recruitment/openings"
              element={<AsyncPage loader={() => import("@/app/portal/recruitment/openings/page")} />}
            />

            {/* Finance & Payroll */}
            <Route
              path="finance-payroll"
              element={<AsyncPage loader={() => import("@/app/portal/finance-payroll/page")} />}
            />
            <Route
              path="finance-payroll/approvals"
              element={
                <AsyncPage loader={() => import("@/app/portal/finance-payroll/approvals/page")} />
              }
            />
            <Route
              path="finance-payroll/reports"
              element={<AsyncPage loader={() => import("@/app/portal/finance-payroll/reports/page")} />}
            />
            <Route
              path="finance-payroll/runs"
              element={<AsyncPage loader={() => import("@/app/portal/finance-payroll/runs/page")} />}
            />
            <Route
              path="finance-payroll/structures"
              element={
                <AsyncPage loader={() => import("@/app/portal/finance-payroll/structures/page")} />
              }
            />

            {/* Manager */}
            <Route
              path="manager"
              element={<AsyncPage loader={() => import("@/app/portal/manager/page")} />}
            />
            <Route
              path="manager/approvals"
              element={<AsyncPage loader={() => import("@/app/portal/manager/approvals/page")} />}
            />
            <Route
              path="manager/shifts"
              element={<AsyncPage loader={() => import("@/app/portal/manager/shifts/page")} />}
            />
            <Route
              path="manager/team"
              element={<AsyncPage loader={() => import("@/app/portal/manager/team/page")} />}
            />

            {/* Department Head */}
            <Route
              path="dept-head"
              element={<AsyncPage loader={() => import("@/app/portal/dept-head/page")} />}
            />
            <Route
              path="dept-head/assets"
              element={<AsyncPage loader={() => import("@/app/portal/dept-head/assets/page")} />}
            />
            <Route
              path="dept-head/leave"
              element={<AsyncPage loader={() => import("@/app/portal/dept-head/leave/page")} />}
            />
            <Route
              path="dept-head/staff"
              element={<AsyncPage loader={() => import("@/app/portal/dept-head/staff/page")} />}
            />

            {/* IT Assets */}
            <Route
              path="it-assets"
              element={<AsyncPage loader={() => import("@/app/portal/it-assets/page")} />}
            />
            <Route
              path="it-assets/allocations"
              element={<AsyncPage loader={() => import("@/app/portal/it-assets/allocations/page")} />}
            />
            <Route
              path="it-assets/inventory"
              element={<AsyncPage loader={() => import("@/app/portal/it-assets/inventory/page")} />}
            />
            <Route
              path="it-assets/maintenance"
              element={<AsyncPage loader={() => import("@/app/portal/it-assets/maintenance/page")} />}
            />

            {/* Employee Self-Service */}
            <Route
              path="employee"
              element={<AsyncPage loader={() => import("@/app/portal/employee/page")} />}
            />
            <Route
              path="employee/attendance"
              element={<AsyncPage loader={() => import("@/app/portal/employee/attendance/page")} />}
            />
            <Route
              path="employee/documents"
              element={<AsyncPage loader={() => import("@/app/portal/employee/documents/page")} />}
            />
            <Route
              path="employee/leave"
              element={<AsyncPage loader={() => import("@/app/portal/employee/leave/page")} />}
            />
            <Route
              path="employee/payslips"
              element={<AsyncPage loader={() => import("@/app/portal/employee/payslips/page")} />}
            />

            {/* Auditor */}
            <Route
              path="auditor"
              element={<AsyncPage loader={() => import("@/app/portal/auditor/page")} />}
            />
            <Route
              path="auditor/changes"
              element={<AsyncPage loader={() => import("@/app/portal/auditor/changes/page")} />}
            />
            <Route
              path="auditor/logs"
              element={<AsyncPage loader={() => import("@/app/portal/auditor/logs/page")} />}
            />
            <Route
              path="auditor/payroll"
              element={<AsyncPage loader={() => import("@/app/portal/auditor/payroll/page")} />}
            />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
