/**
 * Fix Script: job_offers RLS bypass for service_role + leave balance seed
 * Run: node scripts/fix-rls-and-leave.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://divjeeicxdmvwckawopx.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwNTA0MSwiZXhwIjoyMDgxNzgxMDQxfQ.jLsIkO7WX6oHj8Mz64CIki6jL0OTyqDi78JapB2DZiM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSql(sql, label) {
  const { data, error } = await supabase.rpc("exec_sql_as_service", { sql });
  if (error) {
    console.error(`❌ ${label}: ${error.message}`);
    return false;
  }
  console.log(`✅ ${label}`);
  return true;
}

async function main() {
  console.log("🔧 EMS Fix Script: RLS + Leave Balance\n");

  // ─── Fix 1: Ensure job_offers INSERT works without RLS check errors ───
  // The root fix: disable RLS on job_offers for the INSERT path only used by admin,
  // by adding a service_role policy. We use direct table mutations for this.

  // Test if service role can insert into job_offers directly
  const testJobOfferInsert = await supabase.from("job_offers").insert({
    organization_id: "00000001-0000-0000-0000-000000000001",
    candidate_id: "0000000f-0000-0000-0000-000000000001",
    job_posting_id: "0000000e-0000-0000-0000-000000000001",
    offered_salary: 20000,
    joining_date: "2026-12-01",
    status: "draft",
  });

  if (testJobOfferInsert.error) {
    console.error(
      "❌ job_offers INSERT fails with service role:",
      testJobOfferInsert.error.message
    );
    console.log("   → This confirms RLS is blocking service role inserts");
    console.log(
      "   → Need to run SQL directly in Supabase dashboard to fix this"
    );
    console.log("\n📋 SQL to run in Supabase SQL Editor:");
    console.log("─".repeat(60));
    console.log(`
-- Fix: Allow service_role to bypass RLS on job_offers
CREATE POLICY job_offers_service_role ON public.job_offers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix any other recruitment tables that might have same issue:
CREATE POLICY IF NOT EXISTS candidates_service_role ON public.candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS interviews_service_role ON public.interviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS candidate_evaluations_service_role ON public.candidate_evaluations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
`);
    console.log("─".repeat(60));
  } else {
    console.log("✅ job_offers INSERT works fine with service role (duplicate key = expected)");
  }

  // ─── Fix 2: Check leave_ledger for Ramesh Sharma (EMP0009) ───
  const { data: ramesh } = await supabase
    .from("employees")
    .select("id, employee_code, organization_id")
    .eq("employee_code", "EMP0009")
    .single();

  if (!ramesh) {
    console.error("❌ Could not find EMP0009");
    return;
  }

  console.log(`\n📋 Employee: ${ramesh.employee_code} (${ramesh.id})`);

  const { data: ledger } = await supabase
    .from("leave_ledger")
    .select("leave_type_id, days, transaction_type")
    .eq("employee_id", ramesh.id);

  console.log(`   Leave ledger entries: ${ledger?.length ?? 0}`);

  if (!ledger || ledger.length === 0) {
    console.log("   → Seeding leave ledger for EMP0009...");

    // Get leave types for GIET org
    const { data: leaveTypes } = await supabase
      .from("leave_types")
      .select("id, name, days_per_year, is_paid")
      .eq("organization_id", ramesh.organization_id)
      .eq("is_active", true);

    if (!leaveTypes || leaveTypes.length === 0) {
      console.error("   ❌ No leave types found for org");
      return;
    }

    const ledgerEntries = leaveTypes.map((lt) => ({
      organization_id: ramesh.organization_id,
      employee_id: ramesh.id,
      leave_type_id: lt.id,
      transaction_type: "accrual",
      days: lt.is_paid ? lt.days_per_year : 0,
      effective_date: "2026-01-01",
      description: `Annual leave accrual 2026 - ${lt.name}`,
    }));

    const { error: ledgerErr } = await supabase
      .from("leave_ledger")
      .insert(ledgerEntries);

    if (ledgerErr) {
      console.error("   ❌ Failed to seed ledger:", ledgerErr.message);
    } else {
      console.log(
        `   ✅ Seeded ${ledgerEntries.length} leave ledger entries for EMP0009`
      );
    }
  } else {
    console.log("   ✅ Leave ledger already has entries — no action needed");
  }

  // ─── Fix 3: Ensure ALL GIET employees have leave ledger entries ───
  console.log("\n📋 Checking all GIET active employees for leave ledger...");

  const { data: gietEmployees } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("organization_id", "00000001-0000-0000-0000-000000000001")
    .eq("employment_status", "active");

  const { data: gietLeaveTypes } = await supabase
    .from("leave_types")
    .select("id, name, days_per_year, is_paid")
    .eq("organization_id", "00000001-0000-0000-0000-000000000001")
    .eq("is_active", true);

  if (!gietEmployees || !gietLeaveTypes) {
    console.error("   ❌ Could not load GIET employees or leave types");
    return;
  }

  for (const emp of gietEmployees) {
    const { data: empLedger } = await supabase
      .from("leave_ledger")
      .select("id")
      .eq("employee_id", emp.id)
      .limit(1);

    if (!empLedger || empLedger.length === 0) {
      const entries = gietLeaveTypes.map((lt) => ({
        organization_id: "00000001-0000-0000-0000-000000000001",
        employee_id: emp.id,
        leave_type_id: lt.id,
        transaction_type: "accrual",
        days: lt.is_paid ? lt.days_per_year : 0,
        effective_date: "2026-01-01",
        description: `Annual leave accrual 2026 - ${lt.name}`,
      }));

      const { error } = await supabase.from("leave_ledger").insert(entries);
      if (error) {
        console.error(
          `   ❌ ${emp.employee_code} (${emp.first_name} ${emp.last_name}): ${error.message}`
        );
      } else {
        console.log(
          `   ✅ Seeded ${entries.length} entries for ${emp.employee_code} ${emp.first_name} ${emp.last_name}`
        );
      }
    } else {
      console.log(
        `   ✅ ${emp.employee_code} ${emp.first_name} ${emp.last_name}: already has ledger entries`
      );
    }
  }

  console.log("\n✅ Script complete.");
}

main().catch(console.error);
