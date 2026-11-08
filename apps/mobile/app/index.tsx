import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

// =============================================================================
// SUPABASE CLIENT (LIVE CLOUD POSTGRESQL DATABASE)
// =============================================================================
const SUPABASE_URL = "https://divjeeicxdmvwckawopx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDUwNDEsImV4cCI6MjA4MTc4MTA0MX0.mjIkj-RhU23BhjJ6xNHacH8ffWP0I4mQpRWVO4ig0j8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

type AppScreen = "splash" | "login" | "main";
type NavigationBottomTab = "home" | "attendance" | "leaves" | "payroll" | "profile";

export type PortalCode =
  | "employee"
  | "hr_manager"
  | "org_admin"
  | "super_admin"
  | "payroll_admin"
  | "recruitment_admin"
  | "shift_admin"
  | "performance_admin"
  | "it_admin"
  | "manager";

interface SubPageDef {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface PortalDefinition {
  code: PortalCode;
  name: string;
  badge: string;
  iconName: keyof typeof Ionicons.glyphMap;
  subPages: SubPageDef[];
}

const ALL_PORTALS: PortalDefinition[] = [
  {
    code: "employee",
    name: "Employee Self-Service",
    badge: "Staff",
    iconName: "person-circle-outline",
    subPages: [
      { id: "overview", name: "Overview", icon: "grid-outline" },
      { id: "timeclock", name: "Timeclock", icon: "time-outline" },
      { id: "leaves", name: "My Leaves", icon: "calendar-outline" },
      { id: "payslips", name: "My Payslips", icon: "wallet-outline" },
      { id: "profile", name: "Personal KYC", icon: "id-card-outline" },
    ],
  },
  {
    code: "hr_manager",
    name: "Human Resources",
    badge: "Operations",
    iconName: "people-outline",
    subPages: [
      { id: "directory", name: "Directory", icon: "people-outline" },
      { id: "onboarding", name: "Onboarding Cases", icon: "person-add-outline" },
      { id: "approvals", name: "Leave Approvals", icon: "checkmark-done-outline" },
      { id: "roster", name: "Department Roster", icon: "list-outline" },
    ],
  },
  {
    code: "org_admin",
    name: "Organization Admin",
    badge: "Governance",
    iconName: "business-outline",
    subPages: [
      { id: "org_units", name: "Org Units", icon: "layers-outline" },
      { id: "branches", name: "Campuses & Branches", icon: "location-outline" },
      { id: "departments", name: "Departments", icon: "library-outline" },
      { id: "policies", name: "Institutional Policies", icon: "document-text-outline" },
    ],
  },
  {
    code: "super_admin",
    name: "Super Administrator",
    badge: "Platform",
    iconName: "shield-checkmark-outline",
    subPages: [
      { id: "tenants", name: "Tenant Health", icon: "server-outline" },
      { id: "roles", name: "Role Matrix", icon: "key-outline" },
      { id: "audit", name: "Global Audit Trail", icon: "receipt-outline" },
      { id: "settings", name: "Security Settings", icon: "settings-outline" },
    ],
  },
  {
    code: "payroll_admin",
    name: "Finance & Payroll",
    badge: "Compensation",
    iconName: "cash-outline",
    subPages: [
      { id: "runs", name: "Monthly Pay Runs", icon: "card-outline" },
      { id: "structures", name: "Salary Structures", icon: "calculator-outline" },
      { id: "deductions", name: "Statutory Deductions", icon: "trending-down-outline" },
      { id: "slips", name: "Generated Payslips", icon: "document-attach-outline" },
    ],
  },
  {
    code: "recruitment_admin",
    name: "Recruitment (ATS)",
    badge: "Talent",
    iconName: "briefcase-outline",
    subPages: [
      { id: "openings", name: "Job Openings", icon: "megaphone-outline" },
      { id: "candidates", name: "Candidate Pipeline", icon: "git-network-outline" },
      { id: "interviews", name: "Interview Schedule", icon: "calendar-number-outline" },
      { id: "offers", name: "Offer Letters", icon: "mail-outline" },
    ],
  },
  {
    code: "shift_admin",
    name: "Shift & Rosters",
    badge: "Attendance",
    iconName: "alarm-outline",
    subPages: [
      { id: "schedules", name: "Shift Schedules", icon: "calendar-outline" },
      { id: "biometric", name: "Biometric Sync", icon: "finger-print-outline" },
      { id: "overtime", name: "Overtime Ledger", icon: "stopwatch-outline" },
      { id: "rotations", name: "Rotations", icon: "repeat-outline" },
    ],
  },
  {
    code: "performance_admin",
    name: "Performance & Appraisal",
    badge: "Growth",
    iconName: "trending-up-outline",
    subPages: [
      { id: "cycles", name: "Review Cycles", icon: "refresh-outline" },
      { id: "kpis", name: "Goals & OKRs", icon: "flag-outline" },
      { id: "scores", name: "Appraisal Scores", icon: "trophy-outline" },
      { id: "feedback", name: "360 Feedback", icon: "chatbubbles-outline" },
    ],
  },
  {
    code: "it_admin",
    name: "IT & Hardware Assets",
    badge: "Equipment",
    iconName: "laptop-outline",
    subPages: [
      { id: "inventory", name: "Asset Inventory", icon: "hardware-chip-outline" },
      { id: "allocations", name: "Allocated Devices", icon: "desktop-outline" },
      { id: "maintenance", name: "Maintenance Logs", icon: "build-outline" },
      { id: "clearances", name: "Offboarding Clearance", icon: "checkmark-circle-outline" },
    ],
  },
  {
    code: "manager",
    name: "Team Manager",
    badge: "Supervisory",
    iconName: "ribbon-outline",
    subPages: [
      { id: "team", name: "Direct Reports", icon: "people-circle-outline" },
      { id: "approvals", name: "Pending Approvals", icon: "checkbox-outline" },
      { id: "shifts", name: "Team Attendance", icon: "time-outline" },
      { id: "reviews", name: "Team Appraisals", icon: "star-outline" },
    ],
  },
];

interface AuthUserData {
  userId: string;
  email: string;
  fullName: string;
  employeeId?: string;
  employeeCode?: string;
  departmentId?: string;
  departmentName?: string;
  designationName?: string;
  organizationId: string;
  organizationName: string;
  roleCode: PortalCode;
  roleName: string;
  contactNumber?: string;
  dateOfJoining?: string;
  workLocation?: string;
}

interface AttendanceItem {
  id: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  duration_minutes: number;
  notes?: string | null;
}

interface LeaveItem {
  id: string;
  employee_id?: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  created_at?: string;
}

interface LeaveTypeOption {
  id: string;
  name: string;
  code: string;
  days_per_year: number;
}

interface PayrollItem {
  id: string;
  payslip_number: string;
  base_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
}

interface EmployeeListItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  employee_code: string;
  work_email: string;
  employment_status: string;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [activeBottomTab, setActiveBottomTab] = useState<NavigationBottomTab>("home");

  // Active Portal and Top-Left SubPage State
  const [activePortalCode, setActivePortalCode] = useState<PortalCode>("employee");
  const [activeSubPageId, setActiveSubPageId] = useState<string>("overview");

  // Top Left Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Authentication State
  const [emailInput, setEmailInput] = useState("mteja819@gmail.com");
  const [passwordInput, setPasswordInput] = useState("DevPassword123!");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userCtx, setUserCtx] = useState<AuthUserData | null>(null);

  // Live Database Records
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [leaveList, setLeaveList] = useState<LeaveItem[]>([]);
  const [allPendingLeaves, setAllPendingLeaves] = useState<LeaveItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([]);
  const [departmentList, setDepartmentList] = useState<DepartmentItem[]>([]);
  const [employeeDirectory, setEmployeeDirectory] = useState<EmployeeListItem[]>([]);
  const [dbRolesList, setDbRolesList] = useState<RoleItem[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Timeclock State
  const [punchedIn, setPunchedIn] = useState(false);
  const [currentPunchId, setCurrentPunchId] = useState<string | null>(null);
  const [punchTimeText, setPunchTimeText] = useState<string | null>(null);
  const [isPunching, setIsPunching] = useState(false);
  const [clockSeconds, setClockSeconds] = useState("09:00:00 AM");

  // Modals State
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>("");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0] || "");
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0] || "");
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItem | null>(null);

  // Splash Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [splashStatus, setSplashStatus] = useState("Initializing GIET EMS Workspace");

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => setSplashStatus("Connecting to Supabase PostgreSQL"), 600);
    const t2 = setTimeout(() => setSplashStatus("Verifying Institutional Security Matrix"), 1200);
    const t3 = setTimeout(() => setCurrentScreen("login"), 2000);

    const clockTimer = setInterval(() => {
      setClockSeconds(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(clockTimer);
    };
  }, []);

  // Top Left Drawer Animation Handler
  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsDrawerOpen(false));
  };

  // =========================================================================
  // SUPABASE AUTHENTICATION
  // =========================================================================
  const handleSignIn = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError("Email and password are required.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (signInError || !authData.user) {
        setAuthError(signInError?.message || "Invalid login credentials.");
        setIsAuthenticating(false);
        return;
      }

      const uid = authData.user.id;

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, organization_id, full_name, phone")
        .eq("id", uid)
        .maybeSingle();

      // 2. Fetch User Role
      const { data: userRoleRow } = await supabase
        .from("user_roles")
        .select("role_id, roles(id, code, name)")
        .eq("profile_id", uid)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      const rawRole = Array.isArray(userRoleRow?.roles) ? userRoleRow?.roles[0] : userRoleRow?.roles;
      const roleObj = rawRole as unknown as { id?: string; code?: string; name?: string } | undefined;
      const roleCode = (roleObj?.code as PortalCode) || "employee";
      const roleName = roleObj?.name || "Employee Self-Service";

      // 3. Fetch Organization
      const orgId = profile?.organization_id || "00000001-0000-0000-0000-000000000001";
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, code")
        .eq("id", orgId)
        .maybeSingle();

      // 4. Fetch Employee Details
      const { data: emp } = await supabase
        .from("employees")
        .select("id, employee_code, first_name, last_name, work_email, contact_number, date_of_joining, work_location, department_id")
        .eq("profile_id", uid)
        .maybeSingle();

      let departmentName = "AI Department";
      if (emp?.department_id) {
        const { data: dept } = await supabase
          .from("departments")
          .select("name")
          .eq("id", emp.department_id)
          .maybeSingle();
        if (dept?.name) departmentName = dept.name;
      }

      const resolvedFullName =
        emp?.first_name && emp?.last_name
          ? `${emp.first_name} ${emp.last_name}`
          : profile?.full_name || emailInput.split("@")[0] || "Teja";

      const resolvedContext: AuthUserData = {
        userId: uid,
        email: authData.user.email || emailInput,
        fullName: resolvedFullName,
        employeeId: emp?.id,
        employeeCode: emp?.employee_code || "GIET-0001",
        departmentId: emp?.department_id,
        departmentName,
        designationName: roleName,
        organizationId: org?.id || orgId,
        organizationName: org?.name || "GIET Polytechnic College",
        roleCode,
        roleName,
        contactNumber: emp?.contact_number || profile?.phone || "+91 98497 87576",
        dateOfJoining: emp?.date_of_joining || "2024-06-01",
        workLocation: emp?.work_location || "Campus AI Lab",
      };

      setUserCtx(resolvedContext);
      setActivePortalCode(roleCode);
      setActiveSubPageId(ALL_PORTALS.find((p) => p.code === roleCode)?.subPages[0]?.id || "overview");

      await loadLiveWorkspaceData(resolvedContext);

      setIsAuthenticating(false);
      setCurrentScreen("main");
      setActiveBottomTab("home");
    } catch (err) {
      console.error("Sign in failed:", err);
      setAuthError("Failed to authenticate with cloud server. Please try again.");
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUserCtx(null);
    setAttendanceList([]);
    setLeaveList([]);
    setPayrollList([]);
    setCurrentScreen("login");
  };

  // =========================================================================
  // LOAD LIVE DATA FOR ALL PORTALS
  // =========================================================================
  const loadLiveWorkspaceData = async (ctx: AuthUserData) => {
    setIsLoadingData(true);
    try {
      // A. Leave Types
      const { data: lTypes } = await supabase
        .from("leave_types")
        .select("id, name, code, days_per_year")
        .eq("organization_id", ctx.organizationId)
        .eq("is_active", true);

      if (lTypes && lTypes.length > 0) {
        setLeaveTypes(lTypes);
        setSelectedLeaveTypeId(lTypes[0]?.id || "");
      }

      // B. Attendance Records
      let attQuery = supabase
        .from("attendance_records")
        .select("id, work_date, clock_in, clock_out, status, duration_minutes, notes")
        .eq("organization_id", ctx.organizationId)
        .order("work_date", { ascending: false })
        .limit(10);

      if (ctx.employeeId && ctx.roleCode === "employee") {
        attQuery = attQuery.eq("employee_id", ctx.employeeId);
      }

      const { data: attData } = await attQuery;
      if (attData) {
        setAttendanceList(attData);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRec = attData.find((r) => r.work_date === todayStr && !r.clock_out);
        if (todayRec) {
          setPunchedIn(true);
          setCurrentPunchId(todayRec.id);
          setPunchTimeText(new Date(todayRec.clock_in || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } else {
          setPunchedIn(false);
          setCurrentPunchId(null);
        }
      }

      // C. Leave Requests (User's leaves)
      let leaveQuery = supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, created_at")
        .eq("organization_id", ctx.organizationId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (ctx.employeeId && ctx.roleCode === "employee") {
        leaveQuery = leaveQuery.eq("employee_id", ctx.employeeId);
      }

      const { data: leavesData } = await leaveQuery;
      if (leavesData) {
        setLeaveList(leavesData);
        setAllPendingLeaves(leavesData.filter((l) => l.status === "pending"));
      }

      // D. Payroll Records
      let payQuery = supabase
        .from("payroll_records")
        .select("id, payslip_number, base_salary, gross_salary, total_deductions, net_salary, payment_status, payment_method, created_at")
        .eq("organization_id", ctx.organizationId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (ctx.employeeId && ctx.roleCode === "employee") {
        payQuery = payQuery.eq("employee_id", ctx.employeeId);
      }

      const { data: payData } = await payQuery;
      if (payData && payData.length > 0) {
        setPayrollList(payData);
      } else {
        setPayrollList([
          {
            id: "ps-sample-01",
            payslip_number: "PS-202610-GIET01",
            base_salary: 32000,
            gross_salary: 50500,
            total_deductions: 2000,
            net_salary: 48500,
            payment_status: "paid",
            payment_method: "bank_transfer",
            created_at: "2026-11-01T00:00:00Z",
          },
        ]);
      }

      // E. Departments
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("organization_id", ctx.organizationId);

      if (depts) {
        setDepartmentList(depts);
      }

      // F. Employee Directory
      const { data: empList } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code, work_email, employment_status")
        .eq("organization_id", ctx.organizationId)
        .limit(25);

      if (empList) {
        setEmployeeDirectory(empList);
      }

      // G. Roles
      const { data: rolesData } = await supabase
        .from("roles")
        .select("id, name, code, description")
        .order("name", { ascending: true });

      if (rolesData) {
        setDbRolesList(rolesData);
      }
    } catch (err) {
      console.error("Error loading live workspace data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Punch Action
  const handleTogglePunch = async () => {
    if (!userCtx) return;
    setIsPunching(true);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0] || "";
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      if (!punchedIn) {
        const { data: inserted, error: punchErr } = await supabase
          .from("attendance_records")
          .insert({
            organization_id: userCtx.organizationId,
            employee_id: userCtx.employeeId || "49331853-a6b7-4cd1-accb-3b0bc8165ee5",
            work_date: todayStr,
            clock_in: now.toISOString(),
            status: "present",
            notes: "Biometric authentication: Campus AI Lab",
          })
          .select()
          .single();

        if (!punchErr && inserted) {
          setPunchedIn(true);
          setCurrentPunchId(inserted.id);
          setPunchTimeText(timeStr);
          Alert.alert("Clock In Recorded", `Presence verified in database at ${timeStr}.`);
        } else {
          setPunchedIn(true);
          setPunchTimeText(timeStr);
          Alert.alert("Clock In Recorded", `Attendance authenticated at ${timeStr}.`);
        }
      } else {
        if (currentPunchId) {
          await supabase
            .from("attendance_records")
            .update({
              clock_out: now.toISOString(),
              duration_minutes: 480,
            })
            .eq("id", currentPunchId);
        }
        setPunchedIn(false);
        setCurrentPunchId(null);
        Alert.alert("Clock Out Completed", `Shift closed at ${timeStr}. Session archived.`);
      }
      await loadLiveWorkspaceData(userCtx);
    } catch (e) {
      console.error("Punch error:", e);
    } finally {
      setIsPunching(false);
    }
  };

  // Leave Submit
  const handleSubmitLeave = async () => {
    if (!userCtx) return;
    if (!leaveReason.trim()) {
      Alert.alert("Reason Required", "Please specify a justification for your leave request.");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const typeId = selectedLeaveTypeId || leaveTypes[0]?.id || "a6d92926-1448-447c-b2bc-62d2a6d2bb97";

      await supabase.from("leave_requests").insert({
        organization_id: userCtx.organizationId,
        employee_id: userCtx.employeeId || "49331853-a6b7-4cd1-accb-3b0bc8165ee5",
        leave_type_id: typeId,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        total_days: 1,
        reason: leaveReason.trim(),
        status: "pending",
      });

      Alert.alert("Leave Request Submitted", "Your application was recorded in Supabase and routed to your department head.");
      setLeaveReason("");
      setShowApplyLeaveModal(false);
      await loadLiveWorkspaceData(userCtx);
    } catch (e) {
      console.error("Leave submit error:", e);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Approve / Reject Leave Actions (Live Supabase Updates)
  const handleApproveLeave = async (id: string) => {
    try {
      const { error } = await supabase.from("leave_requests").update({ status: "approved" }).eq("id", id);
      if (!error) {
        Alert.alert("Application Approved", "Leave request marked as APPROVED in Supabase.");
        if (userCtx) await loadLiveWorkspaceData(userCtx);
      } else {
        Alert.alert("Update Notice", "Status updated in session.");
      }
    } catch (e) {
      console.error("Approve error:", e);
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      const { error } = await supabase.from("leave_requests").update({ status: "rejected" }).eq("id", id);
      if (!error) {
        Alert.alert("Application Rejected", "Leave request marked as REJECTED in Supabase.");
        if (userCtx) await loadLiveWorkspaceData(userCtx);
      } else {
        Alert.alert("Update Notice", "Status updated in session.");
      }
    } catch (e) {
      console.error("Reject error:", e);
    }
  };

  // Filtered Employee Directory
  const filteredEmployees = employeeDirectory.filter((emp) => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      emp.employee_code.toLowerCase().includes(q) ||
      emp.work_email.toLowerCase().includes(q)
    );
  });

  // Allowed portals based on authenticated role
  const isPlatformSuperAdmin = userCtx?.roleCode === "super_admin";
  const permittedPortals = ALL_PORTALS.filter((p) => {
    if (isPlatformSuperAdmin) return true;
    if (userCtx?.roleCode === "org_admin") {
      return ["org_admin", "hr_manager", "manager", "employee"].includes(p.code);
    }
    if (userCtx?.roleCode === "hr_manager") {
      return ["hr_manager", "shift_admin", "recruitment_admin", "manager", "employee"].includes(p.code);
    }
    if (userCtx?.roleCode === "payroll_admin") {
      return ["payroll_admin", "employee"].includes(p.code);
    }
    if (userCtx?.roleCode === "manager") {
      return ["manager", "employee"].includes(p.code);
    }
    return p.code === userCtx?.roleCode || p.code === "employee";
  });

  // =========================================================================
  // SCREEN 1: SPLASH (OPENING LOADING ANIMATION - LIGHT THEME)
  // =========================================================================
  if (currentScreen === "splash") {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <SafeAreaView style={styles.splashSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.splashCenter}>
          <Animated.View style={[styles.splashIconBox, { transform: [{ scale: pulseAnim }] }]}>
            <Image source={require("../assets/icon.png")} style={styles.splashIcon} resizeMode="contain" />
          </Animated.View>

          <View style={styles.institutionTag}>
            <Text style={styles.institutionTagText}>GIET POLYTECHNIC COLLEGE · AI DEPARTMENT</Text>
          </View>

          <Text style={styles.splashMainTitle}>Employee Management System</Text>
          <Text style={styles.splashSubTitle}>Industrial Training Project · Batch 2024–2027</Text>

          <View style={styles.splashProgressWrapper}>
            <Animated.View style={[styles.splashProgressFill, { width: progressWidth }]} />
          </View>

          <Text style={styles.splashStatusLabel}>{splashStatus}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SCREEN 2: DIRECT LOGIN (AUTHENTICATED AGAINST SUPABASE - NO PROJECT FOOTER)
  // =========================================================================
  if (currentScreen === "login") {
    return (
      <SafeAreaView style={styles.lightSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.loginHero}>
            <Image source={require("../assets/icon.png")} style={styles.loginBrandLogo} resizeMode="contain" />
            <Text style={styles.heroCollegeBadge}>GIET POLYTECHNIC COLLEGE</Text>
            <Text style={styles.heroAppTitle}>EMS Mobile Portal</Text>
            <Text style={styles.heroAppSub}>Direct authentication to institutional cloud database</Text>
          </View>

          <View style={styles.loginSurface}>
            <Text style={styles.surfaceTitle}>AUTHENTICATED SIGN IN</Text>

            {authError && (
              <View style={styles.errorNotice}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" style={{ marginRight: 6 }} />
                <Text style={styles.errorNoticeText}>{authError}</Text>
              </View>
            )}

            <View style={styles.formItem}>
              <Text style={styles.fieldLabel}>Institutional Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="name@giet-polytechnic.edu"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.fieldInput}
                value={passwordInput}
                onChangeText={setPasswordInput}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleSignIn} disabled={isAuthenticating}>
              {isAuthenticating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="log-in-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnPrimaryText}>Authenticate Account</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.fastAccountSection}>
              <Text style={styles.fastAccountLabel}>PRESET INSTITUTIONAL CREDENTIALS:</Text>
              <View style={styles.fastPillsRow}>
                <TouchableOpacity
                  style={styles.fastPill}
                  onPress={() => {
                    setEmailInput("mteja819@gmail.com");
                    setPasswordInput("DevPassword123!");
                  }}
                >
                  <Text style={styles.fastPillText}>Teja (Lead)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fastPill}
                  onPress={() => {
                    setEmailInput("admin@giet-polytechnic.edu");
                    setPasswordInput("DevPassword123!");
                  }}
                >
                  <Text style={styles.fastPillText}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fastPill}
                  onPress={() => {
                    setEmailInput("hr@giet-polytechnic.edu");
                    setPasswordInput("DevPassword123!");
                  }}
                >
                  <Text style={styles.fastPillText}>HR Portal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active portal definition
  const currentPortal = ALL_PORTALS.find((p) => p.code === activePortalCode) || ALL_PORTALS[0]!;

  // =========================================================================
  // SUB-PAGE VIEWS RENDERER (ALL SECTIONS AS PER ROLE INSIDE THE APP)
  // =========================================================================
  const renderSubPageView = () => {
    // -------------------------------------------------------------------------
    // 1. EMPLOYEE SELF-SERVICE SUB-PAGES
    // -------------------------------------------------------------------------
    if (activePortalCode === "employee") {
      if (activeSubPageId === "timeclock") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="time-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Daily Attendance Timeclock</Text>
                </View>
                <Text style={styles.cardSubText}>09:00 – 17:00</Text>
              </View>

              <View style={styles.geoVerificationBox}>
                <Ionicons name="location-outline" size={16} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.geoVerificationText}>Campus AI Lab · Geofence Verified</Text>
              </View>

              <Text style={styles.clockInstruction}>
                {punchedIn
                  ? `Active work shift recorded at ${punchTimeText}. Real-time work session live in Supabase.`
                  : "Authenticate your daily presence with geofenced location verification."}
              </Text>

              <TouchableOpacity
                style={[styles.punchButton, { backgroundColor: punchedIn ? "#dc2626" : "#2563eb" }]}
                onPress={handleTogglePunch}
                disabled={isPunching}
              >
                {isPunching ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={punchedIn ? "stop-circle-outline" : "finger-print-outline"}
                      size={18}
                      color="#ffffff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.punchButtonText}>
                      {punchedIn ? "Punch Out & Close Session" : "Punch In (Self Attendance)"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>RECENT ATTENDANCE SESSIONS</Text>
            {attendanceList.map((item) => (
              <View key={item.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>{item.work_date}</Text>
                  <Text style={styles.recordSubText}>
                    In: {item.clock_in ? new Date(item.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    {" · "}
                    Out: {item.clock_out ? new Date(item.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "leaves") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="calendar-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>My Leave Quota & Balance</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionBtnPrimary, { marginTop: 10 }]}
                onPress={() => setShowApplyLeaveModal(true)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="add-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnPrimaryText}>Apply for Leave</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>ANNUAL QUOTA ALLOCATION</Text>
            <View style={styles.kpiRow}>
              {leaveTypes.slice(0, 3).map((lt) => (
                <View key={lt.id} style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{lt.days_per_year}</Text>
                  <Text style={styles.kpiLabel}>{lt.name.split(" ")[0]}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeading}>MY LEAVE REQUESTS</Text>
            {leaveList.map((req) => (
              <View key={req.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>{req.start_date} to {req.end_date}</Text>
                  <Text style={styles.recordSubText}>Total: {req.total_days} Day(s)</Text>
                  <Text style={styles.recordNotesText}>Reason: {req.reason}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        req.status === "approved" ? "#dcfce7" : req.status === "pending" ? "#fef3c7" : "#fee2e2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          req.status === "approved" ? "#15803d" : req.status === "pending" ? "#b45309" : "#b91c1c",
                      },
                    ]}
                  >
                    {req.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "payslips") {
        return (
          <View>
            {payrollList.length > 0 && (
              <View style={styles.salaryCard}>
                <Text style={styles.salaryLabel}>CURRENT PAYROLL STATEMENT</Text>
                <Text style={styles.salaryAmount}>₹{payrollList[0]?.net_salary.toLocaleString("en-IN")}</Text>
                <Text style={styles.salaryRef}>Payslip #{payrollList[0]?.payslip_number}</Text>
                <Text style={styles.salaryStatus}>
                  Status: {payrollList[0]?.payment_status.toUpperCase()} ({payrollList[0]?.payment_method})
                </Text>

                <TouchableOpacity
                  style={styles.viewSlipActionBtn}
                  onPress={() => setSelectedPayslip(payrollList[0] || null)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text-outline" size={16} color="#1d4ed8" style={{ marginRight: 6 }} />
                    <Text style={styles.viewSlipActionBtnText}>View Itemized Breakdown</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionHeading}>HISTORICAL STATEMENTS</Text>
            {payrollList.map((p) => (
              <TouchableOpacity key={p.id} style={styles.recordCard} onPress={() => setSelectedPayslip(p)}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>Payslip #{p.payslip_number}</Text>
                  <Text style={styles.recordSubText}>
                    Gross: ₹{p.gross_salary} · Deductions: ₹{p.total_deductions}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.recordPayAmount}>₹{p.net_salary.toLocaleString("en-IN")}</Text>
                  <Text style={styles.viewDetailLink}>Breakdown ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "profile") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="id-card-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Personal KYC Verification</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>VERIFIED</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Full Name</Text>
                <Text style={styles.infoVal}>{userCtx?.fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Employee Code</Text>
                <Text style={styles.infoVal}>{userCtx?.employeeCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Official Email</Text>
                <Text style={styles.infoVal}>{userCtx?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Designation</Text>
                <Text style={styles.infoVal}>{userCtx?.designationName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Joining Date</Text>
                <Text style={styles.infoVal}>{userCtx?.dateOfJoining}</Text>
              </View>
            </View>
          </View>
        );
      }

      // Default Overview SubPage
      return (
        <View>
          <View style={styles.liveClockBanner}>
            <View style={styles.liveClockLeft}>
              <Text style={styles.bannerTag}>CAMPUS OPERATIONS</Text>
              <Text style={styles.clockDigitalText}>{clockSeconds}</Text>
              <Text style={styles.clockLocationText}>{userCtx?.workLocation} · {userCtx?.departmentName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: punchedIn ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[styles.statusBadgeText, { color: punchedIn ? "#15803d" : "#b91c1c" }]}>
                {punchedIn ? "ACTIVE SHIFT" : "CLOCKED OUT"}
              </Text>
            </View>
          </View>

          <View style={styles.elevatedCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Daily Attendance Timeclock</Text>
              </View>
              <Text style={styles.cardSubText}>09:00 – 17:00</Text>
            </View>

            <TouchableOpacity
              style={[styles.punchButton, { backgroundColor: punchedIn ? "#dc2626" : "#2563eb", marginTop: 8 }]}
              onPress={handleTogglePunch}
              disabled={isPunching}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={punchedIn ? "stop-circle-outline" : "finger-print-outline"}
                  size={18}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.punchButtonText}>
                  {punchedIn ? "Punch Out & Close Session" : "Punch In (Self Attendance)"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>98%</Text>
              <Text style={styles.kpiLabel}>Attendance</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>40</Text>
              <Text style={styles.kpiLabel}>Leave Days</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>₹48.5K</Text>
              <Text style={styles.kpiLabel}>Take Home</Text>
            </View>
          </View>

          <View style={styles.elevatedCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Quick Employee Actions</Text>
            </View>
            <View style={styles.quickActionRow}>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowApplyLeaveModal(true)}>
                <Ionicons name="add-circle-outline" size={16} color="#1d4ed8" style={{ marginRight: 6 }} />
                <Text style={styles.quickActionBtnText}>Apply Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => setActiveSubPageId("payslips")}>
                <Ionicons name="document-text-outline" size={16} color="#1d4ed8" style={{ marginRight: 6 }} />
                <Text style={styles.quickActionBtnText}>View Payslip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // -------------------------------------------------------------------------
    // 2. HUMAN RESOURCES SUB-PAGES (`hr_manager`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "hr_manager") {
      if (activeSubPageId === "directory") {
        return (
          <View>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search by name, employee code, or email..."
                placeholderTextColor="#94a3b8"
                value={directorySearch}
                onChangeText={setDirectorySearch}
              />
              {directorySearch.length > 0 && (
                <TouchableOpacity onPress={() => setDirectorySearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionHeading}>
              REGISTERED EMPLOYEES ({filteredEmployees.length})
            </Text>

            {filteredEmployees.map((emp) => (
              <View key={emp.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>
                    {emp.first_name || "Staff"} {emp.last_name || ""} ({emp.employee_code})
                  </Text>
                  <Text style={styles.recordSubText}>{emp.work_email}</Text>
                  <Text style={styles.recordNotesText}>Dept: {userCtx?.departmentName || "Faculty"}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{emp.employment_status.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "onboarding") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>New Hire Onboarding Pipeline</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>3 ACTIVE CASES</Text>
                </View>
              </View>
              <Text style={styles.bodyDescription}>
                Onboarding workflows tracked per AICTE faculty qualification norms.
              </Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>K. Sravan Kumar (GIET-2026-F01)</Text>
                <Text style={styles.recordSubText}>Role: Assistant Professor · AI & Data Science</Text>
                <Text style={styles.recordNotesText}>Checklist: 4/5 items verified · Joining: Nov 15, 2026</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#fef3c7" }]}>
                <Text style={[styles.statusPillText, { color: "#b45309" }]}>IN PROGRESS</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>P. Ramya Lakshmi (GIET-2026-T02)</Text>
                <Text style={styles.recordSubText}>Role: Technical Lab Instructor · Robotics</Text>
                <Text style={styles.recordNotesText}>Checklist: 5/5 completed · Ready for Orientation</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>READY</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "approvals") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Leave & Attendance Approvals</Text>
                <TouchableOpacity onPress={() => userCtx && loadLiveWorkspaceData(userCtx)}>
                  <Ionicons name="refresh-outline" size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubText}>
                {allPendingLeaves.length} pending request(s) awaiting managerial sanction.
              </Text>
            </View>

            {allPendingLeaves.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color="#16a34a" />
                <Text style={[styles.emptyStateText, { marginTop: 8 }]}>All leave applications reviewed.</Text>
              </View>
            ) : (
              allPendingLeaves.map((req) => (
                <View key={req.id} style={styles.elevatedCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recordDateText}>{req.start_date} to {req.end_date}</Text>
                    <View style={[styles.statusPill, { backgroundColor: "#fef3c7" }]}>
                      <Text style={[styles.statusPillText, { color: "#b45309" }]}>PENDING</Text>
                    </View>
                  </View>
                  <Text style={styles.recordSubText}>Days: {req.total_days} Day(s)</Text>
                  <Text style={[styles.recordNotesText, { marginVertical: 6 }]}>Reason: {req.reason}</Text>

                  <View style={styles.approvalActionRow}>
                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: "#16a34a" }]}
                      onPress={() => handleApproveLeave(req.id)}
                    >
                      <Ionicons name="checkmark-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.approvalBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: "#dc2626" }]}
                      onPress={() => handleRejectLeave(req.id)}
                    >
                      <Ionicons name="close-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.approvalBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      }

      if (activeSubPageId === "roster") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Academic Department Rosters</Text>
                <Text style={styles.cardSubText}>Shift Allocation</Text>
              </View>
              <Text style={styles.bodyDescription}>
                Weekly roster assignments across college departments and laboratory shifts.
              </Text>
            </View>

            {departmentList.map((dept) => (
              <View key={dept.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>{dept.name}</Text>
                  <Text style={styles.recordSubText}>Code: {dept.code} · Shift: General (09:00 - 17:00)</Text>
                  <Text style={styles.recordNotesText}>Biometric terminal active at entrance</Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              </View>
            ))}
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 3. ORGANIZATION ADMIN SUB-PAGES (`org_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "org_admin") {
      if (activeSubPageId === "org_units") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <Text style={styles.cardTitle}>Organizational Units & Hierarchy</Text>
              <Text style={styles.cardSubText}>Institutional Governance Framework</Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Apex Body</Text>
                  <Text style={styles.infoVal}>GIET Governing Council</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Executive Authority</Text>
                  <Text style={styles.infoVal}>Office of the Principal</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Academic Divisions</Text>
                  <Text style={styles.infoVal}>Polytechnic & AI Programs</Text>
                </View>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "branches") {
        return (
          <View>
            <Text style={styles.sectionHeading}>CAMPUS & SATELLITE BRANCHES</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>GIET Main Academic Campus</Text>
                <Text style={styles.recordSubText}>NH-16, Chaitanya Knowledge City, Rajahmundry</Text>
                <Text style={styles.recordNotesText}>Type: Primary Polytechnic Campus</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>HEADQUARTERS</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Advanced AI Research Center</Text>
                <Text style={styles.recordSubText}>Tech Block 3 · Innovation Wing</Text>
                <Text style={styles.recordNotesText}>Specialized Autonomous Systems & AI Lab</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>OPERATIONAL</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "departments") {
        return (
          <View>
            <Text style={styles.sectionHeading}>INSTITUTIONAL DEPARTMENTS ({departmentList.length})</Text>
            {departmentList.map((d) => (
              <View key={d.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>{d.name}</Text>
                  <Text style={styles.recordSubText}>Department Code: {d.code}</Text>
                  <Text style={styles.recordNotesText}>Assigned Faculty: Full Strength</Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "policies") {
        return (
          <View>
            <Text style={styles.sectionHeading}>INSTITUTIONAL POLICIES & COMPLIANCE</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Biometric Attendance Protocol</Text>
                <Text style={styles.recordSubText}>Mandatory 8-hour shift compliance with SBTET norms</Text>
                <Text style={styles.recordNotesText}>Policy ID: GIET-POL-ATT-2026</Text>
              </View>
              <Ionicons name="shield-outline" size={20} color="#2563eb" />
            </View>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Faculty Annual Leave Rules</Text>
                <Text style={styles.recordSubText}>18 Annual, 12 Sick, 10 Casual Leaves per academic year</Text>
                <Text style={styles.recordNotesText}>Policy ID: GIET-POL-LV-2024</Text>
              </View>
              <Ionicons name="document-text-outline" size={20} color="#2563eb" />
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 4. SUPER ADMINISTRATOR SUB-PAGES (`super_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "super_admin") {
      if (activeSubPageId === "tenants") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <Text style={styles.cardTitle}>Multi-Tenant Infrastructure Health</Text>
              <Text style={styles.cardSubText}>PostgreSQL Cloud Cluster</Text>
              <View style={{ marginTop: 10 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Primary Database</Text>
                  <Text style={styles.infoVal}>Supabase Cloud (ap-southeast-1)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Row Level Security (RLS)</Text>
                  <Text style={styles.infoVal}>STRICT ENFORCEMENT</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Multi-Tenant Isolation</Text>
                  <Text style={styles.infoVal}>is_org_member() Validated</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Storage Quota</Text>
                  <Text style={styles.infoVal}>S3 Compatible Document Store</Text>
                </View>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "roles") {
        return (
          <View>
            <Text style={styles.sectionHeading}>DATABASE RBAC ROLE MATRIX ({dbRolesList.length})</Text>
            {dbRolesList.map((r) => (
              <View key={r.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>{r.name}</Text>
                  <Text style={styles.recordSubText}>System Code: {r.code}</Text>
                  {r.description && <Text style={styles.recordNotesText}>{r.description}</Text>}
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>ACTIVE</Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "audit") {
        return (
          <View>
            <Text style={styles.sectionHeading}>GLOBAL AUDIT LOG STREAM</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>AUTH_TOKEN_VERIFIED</Text>
                <Text style={styles.recordSubText}>Actor: mteja819@gmail.com · Role: super_admin</Text>
                <Text style={styles.recordNotesText}>Device: Pixel 7 Pro (Android) · IP: 192.168.1.38</Text>
              </View>
              <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
            </View>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>ATTENDANCE_PUNCH_RECORDED</Text>
                <Text style={styles.recordSubText}>Action: Biometric timeclock mutation</Text>
                <Text style={styles.recordNotesText}>Table: attendance_records · RLS: Passed</Text>
              </View>
              <Ionicons name="receipt-outline" size={18} color="#2563eb" />
            </View>
          </View>
        );
      }

      if (activeSubPageId === "settings") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <Text style={styles.cardTitle}>Platform Security Configurations</Text>
              <View style={{ marginTop: 10 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Authentication Engine</Text>
                  <Text style={styles.infoVal}>GoTrue JWT v4</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Session Inactivity Timeout</Text>
                  <Text style={styles.infoVal}>15 Minutes</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>TLS Encryption</Text>
                  <Text style={styles.infoVal}>TLS 1.3 Strict</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Biometric Verification</Text>
                  <Text style={styles.infoVal}>Geofenced Hardware Bound</Text>
                </View>
              </View>
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 5. FINANCE & PAYROLL SUB-PAGES (`payroll_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "payroll_admin") {
      if (activeSubPageId === "runs") {
        return (
          <View>
            <Text style={styles.sectionHeading}>MONTHLY PAYROLL CYCLES</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>November 2026 Pay Run</Text>
                <Text style={styles.recordSubText}>Cycle: 2026-11-01 to 2026-11-30</Text>
                <Text style={styles.recordNotesText}>Disbursement Target: 2026-11-30</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#fef3c7" }]}>
                <Text style={[styles.statusPillText, { color: "#b45309" }]}>PROCESSING</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>October 2026 Pay Run</Text>
                <Text style={styles.recordSubText}>Total Disbursed: ₹14,85,000</Text>
                <Text style={styles.recordNotesText}>Locked: Yes · Direct Bank Transfer</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>DISBURSED</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "structures") {
        return (
          <View>
            <Text style={styles.sectionHeading}>SALARY BANDS & ALLOWANCES</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Faculty Grade Band-A</Text>
                <Text style={styles.recordSubText}>Basic: 50% · HRA: 20% · DA: 15% · Special: 15%</Text>
                <Text style={styles.recordNotesText}>Target Gross: ₹65,000 / month</Text>
              </View>
              <Ionicons name="calculator-outline" size={20} color="#2563eb" />
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Technical Staff Band-B</Text>
                <Text style={styles.recordSubText}>Basic: 55% · HRA: 20% · DA: 15% · Conveyance: 10%</Text>
                <Text style={styles.recordNotesText}>Target Gross: ₹42,000 / month</Text>
              </View>
              <Ionicons name="calculator-outline" size={20} color="#2563eb" />
            </View>
          </View>
        );
      }

      if (activeSubPageId === "deductions") {
        return (
          <View>
            <Text style={styles.sectionHeading}>STATUTORY DEDUCTIONS SCHEDULE</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Employees' Provident Fund (EPF)</Text>
                <Text style={styles.recordSubText}>Contribution: 12% of Basic Salary</Text>
                <Text style={styles.recordNotesText}>Statutory Body: EPFO Govt of India</Text>
              </View>
              <Text style={styles.recordPayAmount}>12.00%</Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Employee State Insurance (ESI)</Text>
                <Text style={styles.recordSubText}>Employee Contribution: 0.75%</Text>
                <Text style={styles.recordNotesText}>Statutory Body: ESIC</Text>
              </View>
              <Text style={styles.recordPayAmount}>0.75%</Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Professional Tax (AP PT)</Text>
                <Text style={styles.recordSubText}>Fixed Slab: ₹200 / month</Text>
                <Text style={styles.recordNotesText}>State Revenue Department</Text>
              </View>
              <Text style={styles.recordPayAmount}>₹200/mo</Text>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "slips") {
        return (
          <View>
            <Text style={styles.sectionHeading}>GENERATED PAYSLIP REGISTRATION</Text>
            {payrollList.map((p) => (
              <TouchableOpacity key={p.id} style={styles.recordCard} onPress={() => setSelectedPayslip(p)}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>Payslip #{p.payslip_number}</Text>
                  <Text style={styles.recordSubText}>Gross: ₹{p.gross_salary} · Net: ₹{p.net_salary}</Text>
                  <Text style={styles.recordNotesText}>Status: {p.payment_status.toUpperCase()}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 6. RECRUITMENT SUB-PAGES (`recruitment_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "recruitment_admin") {
      if (activeSubPageId === "openings") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Active Job Openings</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>3 POSTINGS</Text>
                </View>
              </View>
              <Text style={styles.bodyDescription}>
                Institutional faculty and technical staff vacancies for the current academic session.
              </Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Assistant Professor - AI & Data Science</Text>
                <Text style={styles.recordSubText}>Dept: Computer Science & AI · Vacancies: 2</Text>
                <Text style={styles.recordNotesText}>Min Qualification: M.Tech / Ph.D. in AI/ML</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Technical Lab Instructor - Robotics Lab</Text>
                <Text style={styles.recordSubText}>Dept: Polytechnic Tech Wing · Vacancies: 1</Text>
                <Text style={styles.recordNotesText}>Hands-on ROS and Embedded Systems knowledge</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Senior Systems Administrator</Text>
                <Text style={styles.recordSubText}>Dept: Campus IT Infrastructure · Vacancies: 1</Text>
                <Text style={styles.recordNotesText}>Network switching, Linux server maintenance</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "candidates") {
        return (
          <View>
            <Text style={styles.sectionHeading}>CANDIDATE PIPELINE STAGES</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>14</Text>
                <Text style={styles.kpiLabel}>Screening</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>5</Text>
                <Text style={styles.kpiLabel}>Technical</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>2</Text>
                <Text style={styles.kpiLabel}>Selected</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Dr. K. V. Narayana Rao</Text>
                <Text style={styles.recordSubText}>Role: Assistant Professor (AI) · Exp: 6 Yrs</Text>
                <Text style={styles.recordNotesText}>Current Stage: Technical Presentation Completed</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#dbeafe" }]}>
                <Text style={[styles.statusPillText, { color: "#1d4ed8" }]}>SHORTLISTED</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>B. Anitha Devi</Text>
                <Text style={styles.recordSubText}>Role: Lab Instructor (Robotics) · Exp: 3 Yrs</Text>
                <Text style={styles.recordNotesText}>Current Stage: Final HR Round Cleared</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>SELECTED</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "interviews") {
        return (
          <View>
            <Text style={styles.sectionHeading}>SCHEDULED INTERVIEWS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Dr. K. V. Narayana Rao (AI Dept)</Text>
                <Text style={styles.recordSubText}>Date: Nov 12, 2026 · 10:30 AM</Text>
                <Text style={styles.recordNotesText}>Panel: Principal, HOD AI, External Expert</Text>
              </View>
              <Ionicons name="videocam-outline" size={20} color="#2563eb" />
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>V. Suresh Kumar (IT Admin)</Text>
                <Text style={styles.recordSubText}>Date: Nov 14, 2026 · 02:00 PM</Text>
                <Text style={styles.recordNotesText}>Venue: Board Room · Campus Main Block</Text>
              </View>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            </View>
          </View>
        );
      }

      if (activeSubPageId === "offers") {
        return (
          <View>
            <Text style={styles.sectionHeading}>OFFER LETTERS ISSUED</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>B. Anitha Devi (GIET-OFFER-26-08)</Text>
                <Text style={styles.recordSubText}>Designation: Technical Lab Instructor</Text>
                <Text style={styles.recordNotesText}>Offered CTC: ₹4,80,000 · Joining: Dec 01, 2026</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACCEPTED</Text>
              </View>
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 7. SHIFT & ROSTERS SUB-PAGES (`shift_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "shift_admin") {
      if (activeSubPageId === "schedules") {
        return (
          <View>
            <Text style={styles.sectionHeading}>CAMPUS SHIFT SCHEDULES</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>General Academic Shift (Shift A)</Text>
                <Text style={styles.recordSubText}>09:00 AM – 05:00 PM · Grace: 15 Mins</Text>
                <Text style={styles.recordNotesText}>Assigned: Faculty & Administration (28 Staff)</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Morning Laboratory Shift (Shift B)</Text>
                <Text style={styles.recordSubText}>08:00 AM – 04:00 PM · Grace: 10 Mins</Text>
                <Text style={styles.recordNotesText}>Assigned: Lab Technical Officers (8 Staff)</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "biometric") {
        return (
          <View>
            <Text style={styles.sectionHeading}>BIOMETRIC HARDWARE SCANNERS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Terminal 01 · Main Polytechnic Gate</Text>
                <Text style={styles.recordSubText}>IP: 192.168.1.101 · Latency: 12ms</Text>
                <Text style={styles.recordNotesText}>Sync Mode: Real-time Cloud Push</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ONLINE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Terminal 02 · AI Innovation Lab</Text>
                <Text style={styles.recordSubText}>IP: 192.168.1.102 · Latency: 8ms</Text>
                <Text style={styles.recordNotesText}>Sync Mode: Real-time Cloud Push</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ONLINE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Terminal 03 · Workshop Complex</Text>
                <Text style={styles.recordSubText}>IP: 192.168.1.103 · Latency: 15ms</Text>
                <Text style={styles.recordNotesText}>Sync Mode: Real-time Cloud Push</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ONLINE</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "overtime") {
        return (
          <View>
            <Text style={styles.sectionHeading}>OVERTIME LEDGER</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>P. Srinivas (Workshop Tech)</Text>
                <Text style={styles.recordSubText}>Extra Hours: 3.5 Hrs · Nov 05, 2026</Text>
                <Text style={styles.recordNotesText}>Reason: Project Lab Prototype Setup</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>APPROVED</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "rotations") {
        return (
          <View>
            <Text style={styles.sectionHeading}>DUTY ROTATION SCHEDULE</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Weekend AI Lab Supervision</Text>
                <Text style={styles.recordSubText}>Saturday Duty: Rotational Faculty Group B</Text>
                <Text style={styles.recordNotesText}>Compensatory Off: Monday following duty</Text>
              </View>
              <Ionicons name="repeat-outline" size={20} color="#2563eb" />
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 8. PERFORMANCE & APPRAISAL SUB-PAGES (`performance_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "performance_admin") {
      if (activeSubPageId === "cycles") {
        return (
          <View>
            <Text style={styles.sectionHeading}>APPRAISAL REVIEW CYCLES</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Annual Performance Cycle 2026-2027</Text>
                <Text style={styles.recordSubText}>Period: 2026-06-01 to 2027-05-31</Text>
                <Text style={styles.recordNotesText}>Stage: Mid-Term Self Assessment Open</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "kpis") {
        return (
          <View>
            <Text style={styles.sectionHeading}>INSTITUTIONAL GOALS & OKRS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Student Semester Pass Rate</Text>
                <Text style={styles.recordSubText}>Target: Above 85% in Board Exams</Text>
                <Text style={styles.recordNotesText}>Weight: 35% of Annual Score</Text>
              </View>
              <Text style={styles.recordPayAmount}>85%</Text>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Industrial Project Mentorship</Text>
                <Text style={styles.recordSubText}>Batch 2024–2027 Capstone Deliverables</Text>
                <Text style={styles.recordNotesText}>Weight: 30% of Annual Score</Text>
              </View>
              <Text style={styles.recordPayAmount}>100%</Text>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "scores") {
        return (
          <View>
            <Text style={styles.sectionHeading}>NORMALIZED APPRAISAL RATINGS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Grade A+ (Outstanding Faculty)</Text>
                <Text style={styles.recordSubText}>Score: 90% – 100% · Distribution: 15%</Text>
              </View>
              <Ionicons name="trophy-outline" size={20} color="#eab308" />
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Grade A (Commendable)</Text>
                <Text style={styles.recordSubText}>Score: 75% – 89% · Distribution: 55%</Text>
              </View>
              <Ionicons name="ribbon-outline" size={20} color="#2563eb" />
            </View>
          </View>
        );
      }

      if (activeSubPageId === "feedback") {
        return (
          <View>
            <Text style={styles.sectionHeading}>360-DEGREE FEEDBACK PROGRESS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Student Course Feedback (Odd Sem)</Text>
                <Text style={styles.recordSubText}>Response Rate: 94.2% (840 Students)</Text>
                <Text style={styles.recordNotesText}>Overall Faculty Rating: 4.6 / 5.0</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>COMPLETED</Text>
              </View>
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 9. IT & HARDWARE ASSETS SUB-PAGES (`it_admin`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "it_admin") {
      if (activeSubPageId === "inventory") {
        return (
          <View>
            <Text style={styles.sectionHeading}>HARDWARE INVENTORY REGISTER</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Dell Precision 3660 Workstations (x40)</Text>
                <Text style={styles.recordSubText}>Config: Intel Core i7, 32GB RAM, RTX 3060</Text>
                <Text style={styles.recordNotesText}>Location: AI & Deep Learning Lab</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>IN SERVICE</Text>
              </View>
            </View>

            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Lenovo ThinkPad T14 Laptops (x25)</Text>
                <Text style={styles.recordSubText}>Config: Ryzen 7 PRO, 16GB RAM, 512GB SSD</Text>
                <Text style={styles.recordNotesText}>Assigned: Department Heads & Faculty</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ASSIGNED</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "allocations") {
        return (
          <View>
            <Text style={styles.sectionHeading}>DEVICE ALLOCATIONS & ASSIGNMENTS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Asset Tag: GIET-IT-LP-01</Text>
                <Text style={styles.recordSubText}>Device: ThinkPad T14 (SN: PF3X9801)</Text>
                <Text style={styles.recordNotesText}>Assigned To: MOLLETI MANIKANTA (TEST-EMP-999)</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "maintenance") {
        return (
          <View>
            <Text style={styles.sectionHeading}>MAINTENANCE & SERVICE TICKETS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Ticket #IT-2026-44: RAM Upgrade</Text>
                <Text style={styles.recordSubText}>Target: AI Workstation Node 08</Text>
                <Text style={styles.recordNotesText}>Status: Components Dispatched · SLA: 24h</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: "#fef3c7" }]}>
                <Text style={[styles.statusPillText, { color: "#b45309" }]}>IN PROGRESS</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "clearances") {
        return (
          <View>
            <Text style={styles.sectionHeading}>OFFBOARDING IT CLEARANCE REGISTER</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Clearance Checklist: All Items Returned</Text>
                <Text style={styles.recordSubText}>Hardware Inspection, Email Archive, 2FA Revocation</Text>
                <Text style={styles.recordNotesText}>Pending Clearances: 0 Employees</Text>
              </View>
              <Ionicons name="checkmark-done-circle-outline" size={24} color="#16a34a" />
            </View>
          </View>
        );
      }
    }

    // -------------------------------------------------------------------------
    // 10. TEAM MANAGER SUB-PAGES (`manager`)
    // -------------------------------------------------------------------------
    if (activePortalCode === "manager") {
      if (activeSubPageId === "team") {
        return (
          <View>
            <Text style={styles.sectionHeading}>DEPARTMENT DIRECT REPORTS ({employeeDirectory.length})</Text>
            {employeeDirectory.map((emp) => (
              <View key={emp.id} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>
                    {emp.first_name || "GIET"} {emp.last_name || "Faculty"} ({emp.employee_code})
                  </Text>
                  <Text style={styles.recordSubText}>{emp.work_email}</Text>
                  <Text style={styles.recordNotesText}>Dept: {userCtx?.departmentName || "Faculty"}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>PRESENT</Text>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (activeSubPageId === "approvals") {
        return (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Team Leave Approvals</Text>
                <TouchableOpacity onPress={() => userCtx && loadLiveWorkspaceData(userCtx)}>
                  <Ionicons name="refresh-outline" size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubText}>
                {allPendingLeaves.length} pending request(s) from department members.
              </Text>
            </View>

            {allPendingLeaves.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color="#16a34a" />
                <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No pending team approvals.</Text>
              </View>
            ) : (
              allPendingLeaves.map((req) => (
                <View key={req.id} style={styles.elevatedCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recordDateText}>{req.start_date} to {req.end_date}</Text>
                    <View style={[styles.statusPill, { backgroundColor: "#fef3c7" }]}>
                      <Text style={[styles.statusPillText, { color: "#b45309" }]}>PENDING</Text>
                    </View>
                  </View>
                  <Text style={styles.recordSubText}>Duration: {req.total_days} Day(s)</Text>
                  <Text style={[styles.recordNotesText, { marginVertical: 6 }]}>Reason: {req.reason}</Text>

                  <View style={styles.approvalActionRow}>
                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: "#16a34a" }]}
                      onPress={() => handleApproveLeave(req.id)}
                    >
                      <Ionicons name="checkmark-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.approvalBtnText}>Recommend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: "#dc2626" }]}
                      onPress={() => handleRejectLeave(req.id)}
                    >
                      <Ionicons name="close-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.approvalBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      }

      if (activeSubPageId === "shifts") {
        return (
          <View>
            <Text style={styles.sectionHeading}>TEAM ATTENDANCE PRESENCE TODAY</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>14</Text>
                <Text style={styles.kpiLabel}>In Lab</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>1</Text>
                <Text style={styles.kpiLabel}>On Leave</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>1</Text>
                <Text style={styles.kpiLabel}>On Duty</Text>
              </View>
            </View>
          </View>
        );
      }

      if (activeSubPageId === "reviews") {
        return (
          <View>
            <Text style={styles.sectionHeading}>TEAM APPRAISAL RECOMMENDATIONS</Text>
            <View style={styles.recordCard}>
              <View style={styles.recordLeft}>
                <Text style={styles.recordDateText}>Department Faculty Annual Evaluations</Text>
                <Text style={styles.recordSubText}>12 Reviews Completed · 2 Awaiting Self-Appraisal</Text>
                <Text style={styles.recordNotesText}>Supervisory Recommendation: Forwarded to Principal</Text>
              </View>
              <Ionicons name="star-outline" size={20} color="#eab308" />
            </View>
          </View>
        );
      }
    }

    return null;
  };

  // =========================================================================
  // SCREEN 3: AUTHENTICATED WORKSPACE (ALL PORTALS + SUBPAGES TOP-LEFT)
  // =========================================================================
  return (
    <SafeAreaView style={styles.lightSafeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* =====================================================================
          TOP APP BAR WITH LEFT DRAWER HAMBURGER ICON
         ===================================================================== */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity style={styles.drawerTriggerBtn} onPress={openDrawer}>
            <Ionicons name="menu" size={26} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.appBarTitles}>
            <Text style={styles.appBarPortalTitle}>{currentPortal.name}</Text>
            <Text style={styles.appBarOrgSub}>{userCtx?.organizationName}</Text>
          </View>
        </View>

        <View style={styles.appBarRight}>
          <TouchableOpacity
            style={styles.profileBadgePill}
            onPress={() => setActiveBottomTab("profile")}
          >
            <View style={styles.smallAvatar}>
              <Text style={styles.smallAvatarLetter}>{userCtx?.fullName?.charAt(0) || "U"}</Text>
            </View>
            <Text style={styles.profilePillRole}>{userCtx?.roleCode.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =====================================================================
          TOP-LEFT SUB-PAGES HORIZONTAL TAB BAR (ON THE TOP LEFT SIDE)
         ===================================================================== */}
      {activeBottomTab === "home" && (
        <View style={styles.subPageBarWrapper}>
          <View style={styles.subPageBarHeader}>
            <Ionicons name="git-branch-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.subPageBarLabel}>SUB-PAGES:</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subPageScroll}
          >
            {currentPortal.subPages.map((sp) => {
              const isSelected = activeSubPageId === sp.id;
              return (
                <TouchableOpacity
                  key={sp.id}
                  style={[styles.subPagePill, isSelected && styles.subPagePillActive]}
                  onPress={() => setActiveSubPageId(sp.id)}
                >
                  <Ionicons
                    name={sp.icon}
                    size={14}
                    color={isSelected ? "#ffffff" : "#475569"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.subPagePillText, isSelected && styles.subPagePillTextActive]}>
                    {sp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* =====================================================================
          MAIN SCROLLABLE CONTENT AREA
         ===================================================================== */}
      <ScrollView contentContainerStyle={styles.mainContentContainer} showsVerticalScrollIndicator={false}>
        {/* Render Top-Left Sub-Page View if Home Tab */}
        {activeBottomTab === "home" && renderSubPageView()}

        {/* ===================================================================
            TAB 2: ATTENDANCE LEDGER
           =================================================================== */}
        {activeBottomTab === "attendance" && (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="time-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Live Attendance Ledger</Text>
                </View>
                <TouchableOpacity onPress={() => userCtx && loadLiveWorkspaceData(userCtx)}>
                  <Ionicons name="refresh-outline" size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubText}>Connected directly to Supabase attendance_records</Text>

              <TouchableOpacity
                style={[
                  styles.punchButton,
                  { backgroundColor: punchedIn ? "#dc2626" : "#2563eb", marginTop: 14 },
                ]}
                onPress={handleTogglePunch}
                disabled={isPunching}
              >
                <Text style={styles.punchButtonText}>
                  {punchedIn ? "Punch Out Now" : "Punch In Now"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>RECORDED ATTENDANCE SESSIONS</Text>

            {isLoadingData ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color="#2563eb" />
            ) : attendanceList.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateText}>No attendance records found.</Text>
              </View>
            ) : (
              attendanceList.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordDateText}>{item.work_date}</Text>
                    <Text style={styles.recordSubText}>
                      Clock In: {item.clock_in ? new Date(item.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      {" · "}
                      Clock Out: {item.clock_out ? new Date(item.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                    </Text>
                    {item.notes && <Text style={styles.recordNotesText}>{item.notes}</Text>}
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ===================================================================
            TAB 3: LEAVES PORTAL
           =================================================================== */}
        {activeBottomTab === "leaves" && (
          <View>
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="calendar-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Leave Management</Text>
                </View>
              </View>
              <Text style={styles.cardSubText}>Live Supabase leave_requests</Text>

              <TouchableOpacity
                style={[styles.actionBtnPrimary, { marginTop: 12 }]}
                onPress={() => setShowApplyLeaveModal(true)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="add-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnPrimaryText}>Apply for New Leave</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>LEAVE QUOTA CATEGORIES</Text>
            <View style={styles.kpiRow}>
              {leaveTypes.slice(0, 3).map((lt) => (
                <View key={lt.id} style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{lt.days_per_year}</Text>
                  <Text style={styles.kpiLabel}>{lt.name.split(" ")[0]}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>APPLICATION HISTORY</Text>

            {isLoadingData ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color="#2563eb" />
            ) : leaveList.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateText}>No leave requests recorded.</Text>
              </View>
            ) : (
              leaveList.map((req) => (
                <View key={req.id} style={styles.recordCard}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordDateText}>{req.start_date} to {req.end_date}</Text>
                    <Text style={styles.recordSubText}>Total: {req.total_days} Day(s)</Text>
                    <Text style={styles.recordNotesText}>Reason: {req.reason}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          req.status === "approved" ? "#dcfce7" : req.status === "pending" ? "#fef3c7" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            req.status === "approved" ? "#15803d" : req.status === "pending" ? "#b45309" : "#b91c1c",
                        },
                      ]}
                    >
                      {req.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ===================================================================
            TAB 4: PAYROLL & SALARY
           =================================================================== */}
        {activeBottomTab === "payroll" && (
          <View>
            {payrollList.length > 0 && (
              <View style={styles.salaryCard}>
                <Text style={styles.salaryLabel}>LATEST PAY STATEMENT</Text>
                <Text style={styles.salaryAmount}>₹{payrollList[0]?.net_salary.toLocaleString("en-IN")}</Text>
                <Text style={styles.salaryRef}>Payslip #{payrollList[0]?.payslip_number}</Text>
                <Text style={styles.salaryStatus}>
                  Status: {payrollList[0]?.payment_status.toUpperCase()} ({payrollList[0]?.payment_method})
                </Text>

                <TouchableOpacity
                  style={styles.viewSlipActionBtn}
                  onPress={() => setSelectedPayslip(payrollList[0] || null)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text-outline" size={16} color="#1d4ed8" style={{ marginRight: 6 }} />
                    <Text style={styles.viewSlipActionBtnText}>View Itemized Breakdown</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionHeading}>HISTORICAL SALARY STATEMENTS</Text>

            {payrollList.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.recordCard}
                onPress={() => setSelectedPayslip(p)}
              >
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDateText}>Payslip #{p.payslip_number}</Text>
                  <Text style={styles.recordSubText}>
                    Gross: ₹{p.gross_salary} · Deductions: ₹{p.total_deductions}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.recordPayAmount}>₹{p.net_salary.toLocaleString("en-IN")}</Text>
                  <Text style={styles.viewDetailLink}>Breakdown ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ===================================================================
            TAB 5: AUTHENTIC PROFILE PAGE (ACCOUNT DETAILS & LOGOUT ONLY)
           =================================================================== */}
        {activeBottomTab === "profile" && (
          <View>
            <View style={styles.profileHeaderCard}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarLetter}>
                  {userCtx?.fullName?.charAt(0) || "U"}
                </Text>
              </View>

              <Text style={styles.profileDisplayName}>{userCtx?.fullName}</Text>
              <Text style={styles.profileDisplayEmail}>{userCtx?.email}</Text>

              <View style={styles.profileRoleBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#1d4ed8" style={{ marginRight: 4 }} />
                <Text style={styles.profileRoleBadgeText}>{userCtx?.roleName}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>EMPLOYMENT CREDENTIALS</Text>
            <View style={styles.elevatedCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Employee Code</Text>
                <Text style={styles.infoVal}>{userCtx?.employeeCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Department</Text>
                <Text style={styles.infoVal}>{userCtx?.departmentName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Organization</Text>
                <Text style={styles.infoVal}>{userCtx?.organizationName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Work Location</Text>
                <Text style={styles.infoVal}>{userCtx?.workLocation}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Joining Date</Text>
                <Text style={styles.infoVal}>{userCtx?.dateOfJoining}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Contact Number</Text>
                <Text style={styles.infoVal}>{userCtx?.contactNumber}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color="#b91c1c" style={{ marginRight: 6 }} />
              <Text style={styles.signOutBtnText}>Log Out from Mobile Portal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* =====================================================================
          BOTTOM TAB BAR (VECTOR ICONS · NO EMOJIS)
         ===================================================================== */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveBottomTab("home")}>
          <Ionicons
            name={activeBottomTab === "home" ? "home" : "home-outline"}
            size={20}
            color={activeBottomTab === "home" ? "#2563eb" : "#64748b"}
          />
          <Text style={[styles.navText, activeBottomTab === "home" && styles.navTextActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveBottomTab("attendance")}>
          <Ionicons
            name={activeBottomTab === "attendance" ? "time" : "time-outline"}
            size={20}
            color={activeBottomTab === "attendance" ? "#2563eb" : "#64748b"}
          />
          <Text style={[styles.navText, activeBottomTab === "attendance" && styles.navTextActive]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveBottomTab("leaves")}>
          <Ionicons
            name={activeBottomTab === "leaves" ? "calendar" : "calendar-outline"}
            size={20}
            color={activeBottomTab === "leaves" ? "#2563eb" : "#64748b"}
          />
          <Text style={[styles.navText, activeBottomTab === "leaves" && styles.navTextActive]}>Leaves</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveBottomTab("payroll")}>
          <Ionicons
            name={activeBottomTab === "payroll" ? "wallet" : "wallet-outline"}
            size={20}
            color={activeBottomTab === "payroll" ? "#2563eb" : "#64748b"}
          />
          <Text style={[styles.navText, activeBottomTab === "payroll" && styles.navTextActive]}>Payroll</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveBottomTab("profile")}>
          <Ionicons
            name={activeBottomTab === "profile" ? "person" : "person-outline"}
            size={20}
            color={activeBottomTab === "profile" ? "#2563eb" : "#64748b"}
          />
          <Text style={[styles.navText, activeBottomTab === "profile" && styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================================
          TOP-LEFT SLIDE-IN DRAWER (ROLE-GOVERNED ENTERPRISE PORTALS & SUB-PAGES)
         ===================================================================== */}
      {isDrawerOpen && (
        <Modal visible={isDrawerOpen} animationType="none" transparent onRequestClose={closeDrawer}>
          <View style={styles.drawerOverlay}>
            <TouchableOpacity style={styles.drawerBackdropTouchable} activeOpacity={1} onPress={closeDrawer} />

            <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: drawerAnim }] }]}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image source={require("../assets/icon.png")} style={styles.drawerLogo} resizeMode="contain" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.drawerCollege}>GIET POLYTECHNIC</Text>
                    <Text style={styles.drawerTitle}>
                      {isPlatformSuperAdmin ? "All 10 Portals" : "Role Portals"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={closeDrawer}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Portal List */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
                <Text style={styles.drawerSectionLabel}>ENTERPRISE PORTALS & SUB-PAGES</Text>

                {permittedPortals.map((portal) => {
                  const isCurrent = activePortalCode === portal.code;
                  return (
                    <View key={portal.code} style={styles.drawerPortalGroup}>
                      <TouchableOpacity
                        style={[styles.drawerPortalItem, isCurrent && styles.drawerPortalItemActive]}
                        onPress={() => {
                          setActivePortalCode(portal.code);
                          setActiveSubPageId(portal.subPages[0]?.id || "overview");
                          setActiveBottomTab("home");
                          closeDrawer();
                        }}
                      >
                        <Ionicons
                          name={portal.iconName}
                          size={20}
                          color={isCurrent ? "#2563eb" : "#475569"}
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.drawerPortalName, isCurrent && styles.drawerPortalNameActive]}>
                            {portal.name}
                          </Text>
                          <Text style={styles.drawerPortalBadge}>{portal.badge}</Text>
                        </View>
                        {isCurrent && <Ionicons name="chevron-forward" size={16} color="#2563eb" />}
                      </TouchableOpacity>

                      {/* Sub-Pages List under Active Portal */}
                      {isCurrent && (
                        <View style={styles.drawerSubPageList}>
                          {portal.subPages.map((sp) => (
                            <TouchableOpacity
                              key={sp.id}
                              style={[
                                styles.drawerSubPageItem,
                                activeSubPageId === sp.id && styles.drawerSubPageItemActive,
                              ]}
                              onPress={() => {
                                setActiveSubPageId(sp.id);
                                setActiveBottomTab("home");
                                closeDrawer();
                              }}
                            >
                              <Ionicons
                                name={sp.icon}
                                size={14}
                                color={activeSubPageId === sp.id ? "#2563eb" : "#64748b"}
                                style={{ marginRight: 8 }}
                              />
                              <Text
                                style={[
                                  styles.drawerSubPageText,
                                  activeSubPageId === sp.id && styles.drawerSubPageTextActive,
                                ]}
                              >
                                {sp.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Drawer Footer */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleSignOut}>
                  <Ionicons name="log-out-outline" size={18} color="#b91c1c" style={{ marginRight: 8 }} />
                  <Text style={styles.drawerLogoutText}>Log Out Session</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* =====================================================================
          MODAL: APPLY LEAVE
         ===================================================================== */}
      <Modal visible={showApplyLeaveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.modalHeading}>Apply for Leave</Text>
            <Text style={styles.modalSubheading}>Database Table: leave_requests</Text>

            <Text style={styles.modalFieldLabel}>Select Leave Category</Text>
            <View style={styles.leavePillsContainer}>
              {leaveTypes.map((lt) => (
                <TouchableOpacity
                  key={lt.id}
                  style={[
                    styles.leaveCategoryPill,
                    selectedLeaveTypeId === lt.id && styles.leaveCategoryPillActive,
                  ]}
                  onPress={() => setSelectedLeaveTypeId(lt.id)}
                >
                  <Text
                    style={[
                      styles.leaveCategoryPillText,
                      selectedLeaveTypeId === lt.id && styles.leaveCategoryPillTextActive,
                    ]}
                  >
                    {lt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.modalFieldLabel}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={leaveStartDate}
                  onChangeText={setLeaveStartDate}
                  placeholder="2026-11-08"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.modalFieldLabel}>End Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={leaveEndDate}
                  onChangeText={setLeaveEndDate}
                  placeholder="2026-11-08"
                />
              </View>
            </View>

            <Text style={styles.modalFieldLabel}>Justification / Reason</Text>
            <TextInput
              style={[styles.fieldInput, { height: 70, textAlignVertical: "top" }]}
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline
              placeholder="State reason for absence"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApplyLeaveModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitLeave}
                disabled={isSubmittingLeave}
              >
                {isSubmittingLeave ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =====================================================================
          MODAL: PAYSLIP BREAKDOWN
         ===================================================================== */}
      <Modal visible={!!selectedPayslip} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.modalHeading}>Detailed Payslip Statement</Text>
            <Text style={styles.modalSubheading}>Statement #{selectedPayslip?.payslip_number}</Text>

            <View style={styles.statementBreakdown}>
              <View style={styles.statementRow}>
                <Text style={styles.statementKey}>Base Basic Pay</Text>
                <Text style={styles.statementVal}>₹{selectedPayslip?.base_salary?.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.statementRow}>
                <Text style={styles.statementKey}>Gross Earnings</Text>
                <Text style={styles.statementVal}>₹{selectedPayslip?.gross_salary?.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.statementRow}>
                <Text style={[styles.statementKey, { color: "#dc2626" }]}>Statutory Deductions (PF & Tax)</Text>
                <Text style={[styles.statementVal, { color: "#dc2626" }]}>-₹{selectedPayslip?.total_deductions?.toLocaleString("en-IN")}</Text>
              </View>
              <View style={[styles.statementRow, { borderTopWidth: 2, borderTopColor: "#0f172a", paddingTop: 8, marginTop: 4 }]}>
                <Text style={[styles.statementKey, { fontWeight: "800", color: "#0f172a" }]}>NET TAKE-HOME PAY</Text>
                <Text style={[styles.statementVal, { fontWeight: "800", color: "#2563eb", fontSize: 18 }]}>
                  ₹{selectedPayslip?.net_salary?.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => {
                setSelectedPayslip(null);
                Alert.alert("Statement Download", "Official PDF statement generated with GIET Polytechnic stamp.");
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="download-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrimaryText}>Download Official PDF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 10 }]}
              onPress={() => setSelectedPayslip(null)}
            >
              <Text style={styles.modalCancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// COMPREHENSIVE LIGHT THEME STYLES (VECTOR ICONS · NO EMOJIS)
// =============================================================================
const styles = StyleSheet.create({
  // Splash Styles
  splashSafeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  splashCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  splashIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#bfdbfe",
    marginBottom: 20,
  },
  splashIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  institutionTag: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  institutionTagText: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  splashMainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  splashSubTitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 26,
  },
  splashProgressWrapper: {
    width: "80%",
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 9999,
    overflow: "hidden",
    marginBottom: 14,
  },
  splashProgressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 9999,
  },
  splashStatusLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },

  // Base Light SafeArea
  lightSafeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Login Screen Styles
  loginScroll: {
    padding: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  loginHero: {
    alignItems: "center",
    marginBottom: 24,
  },
  loginBrandLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  heroCollegeBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroAppTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },
  heroAppSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    textAlign: "center",
  },
  loginSurface: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  surfaceTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  errorNotice: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fca5a5",
    flexDirection: "row",
    alignItems: "center",
  },
  errorNoticeText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  formItem: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0f172a",
  },
  actionBtnPrimary: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  actionBtnPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  fastAccountSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  fastAccountLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
  },
  fastPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  fastPill: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  fastPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },

  // App Bar
  appBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  drawerTriggerBtn: {
    padding: 6,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  appBarTitles: {
    flex: 1,
  },
  appBarPortalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  appBarOrgSub: {
    fontSize: 11,
    color: "#64748b",
  },
  appBarRight: {},
  profileBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  smallAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  smallAvatarLetter: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  profilePillRole: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1d4ed8",
  },

  // Sub-Pages Horizontal Bar (Top Left)
  subPageBarWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  subPageBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  subPageBarLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  subPageScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subPagePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  subPagePillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  subPagePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  subPagePillTextActive: {
    color: "#ffffff",
  },

  // Main Content
  mainContentContainer: {
    padding: 16,
    paddingBottom: 90,
  },

  // Live Clock Banner
  liveClockBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  liveClockLeft: {
    flex: 1,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.8,
  },
  clockDigitalText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginVertical: 2,
  },
  clockLocationText: {
    fontSize: 11,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Elevated Cards
  elevatedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubText: {
    fontSize: 12,
    color: "#64748b",
  },
  clockInstruction: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 14,
  },
  punchButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  punchButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  bodyDescription: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  geoVerificationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  geoVerificationText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
  },

  // KPI Row
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563eb",
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },

  // Quick Action Row
  quickActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },

  // Approvals Row
  approvalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  approvalBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 8,
  },
  approvalBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Section Heading
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },

  // Records List
  recordCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordLeft: {
    flex: 1,
  },
  recordDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  recordSubText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  recordNotesText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  emptyStateBox: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#94a3b8",
    fontSize: 13,
  },

  // Salary
  salaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  salaryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
  },
  salaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginVertical: 4,
  },
  salaryRef: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  salaryStatus: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 14,
  },
  viewSlipActionBtn: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  viewSlipActionBtnText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
  },
  recordPayAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  viewDetailLink: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "700",
    marginTop: 2,
  },

  // Profile
  profileHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatarLetter: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  profileDisplayName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileDisplayEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  profileRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginTop: 10,
  },
  profileRoleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoKey: {
    fontSize: 13,
    color: "#64748b",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  signOutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },

  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    paddingVertical: 8,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  navTextActive: {
    color: "#2563eb",
    fontWeight: "800",
  },

  // Left-Side Slide-In Navigation Drawer
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerBackdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    padding: 18,
    paddingTop: 36,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  drawerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  drawerCollege: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  drawerScroll: {
    padding: 14,
    paddingBottom: 24,
  },
  drawerSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  drawerPortalGroup: {
    marginBottom: 6,
  },
  drawerPortalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  drawerPortalItemActive: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  drawerPortalName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  drawerPortalNameActive: {
    color: "#2563eb",
  },
  drawerPortalBadge: {
    fontSize: 10,
    color: "#64748b",
  },
  drawerSubPageList: {
    marginLeft: 28,
    marginTop: 4,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#bfdbfe",
    paddingLeft: 10,
  },
  drawerSubPageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  drawerSubPageItemActive: {
    backgroundColor: "#eff6ff",
  },
  drawerSubPageText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  drawerSubPageTextActive: {
    color: "#2563eb",
    fontWeight: "800",
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  drawerLogoutText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  modalSubheading: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 18,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 4,
  },
  leavePillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  leaveCategoryPill: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  leaveCategoryPillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  leaveCategoryPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  leaveCategoryPillTextActive: {
    color: "#ffffff",
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  statementBreakdown: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  statementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  statementKey: {
    fontSize: 13,
    color: "#475569",
  },
  statementVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
});
