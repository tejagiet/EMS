// Fix: job_offers RLS test + leave ledger seed
// Run from apps/web: node ../../scripts/fix-rls-and-leave.cjs
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://divjeeicxdmvwckawopx.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwNTA0MSwiZXhwIjoyMDgxNzgxMDQxfQ.jLsIkO7WX6oHj8Mz64CIki6jL0OTyqDi78JapB2DZiM";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GIET_ORG = "00000001-0000-0000-0000-000000000001";

async function main() {
  console.log("🔧 EMS Fix Script: RLS + Leave Balance\n");

  // Test 1: job_offers insert with service role
  const r = await sb.from("job_offers").insert({
    organization_id: GIET_ORG,
    candidate_id: "0000000f-0000-0000-0000-000000000001",
    job_posting_id: "0000000e-0000-0000-0000-000000000001",
    offered_salary: 20000,
    joining_date: "2026-12-15",
    status: "draft",
  });

  if (r.error) {
    if (r.error.code === "23505") {
      console.log("✅ job_offers INSERT works (duplicate key = OK, candidate already has offer)");
    } else {
      console.error("❌ job_offers INSERT fails:", r.error.message, "(code:", r.error.code + ")");
      if (r.error.code === "42501") {
        console.log("\n📋 RLS BLOCKING SERVICE ROLE. Run this in Supabase SQL Editor:");
        console.log("─".repeat(60));
        console.log(`
CREATE POLICY IF NOT EXISTS job_offers_service_bypass ON public.job_offers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
        `);
        console.log("─".repeat(60));
      }
    }
  } else {
    console.log("✅ job_offers INSERT works fine with service role");
    // Clean up test insert
    await sb.from("job_offers").delete()
      .eq("candidate_id", "0000000f-0000-0000-0000-000000000001")
      .eq("joining_date", "2026-12-15");
  }

  // Fix 2: Seed leave ledger for all GIET employees
  console.log("\n📋 Checking leave ledger for all GIET employees...");

  const { data: employees, error: empErr } = await sb
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("organization_id", GIET_ORG)
    .eq("employment_status", "active");

  if (empErr || !employees) {
    console.error("❌ Could not load employees:", empErr?.message);
    return;
  }

  const { data: leaveTypes, error: ltErr } = await sb
    .from("leave_types")
    .select("id, name, days_per_year, is_paid")
    .eq("organization_id", GIET_ORG)
    .eq("is_active", true);

  if (ltErr || !leaveTypes) {
    console.error("❌ Could not load leave types:", ltErr?.message);
    return;
  }

  console.log(`   Found ${employees.length} employees, ${leaveTypes.length} leave types`);

  for (const emp of employees) {
    const { data: existing } = await sb
      .from("leave_ledger")
      .select("id")
      .eq("employee_id", emp.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const entries = leaveTypes.map((lt) => ({
        organization_id: GIET_ORG,
        employee_id: emp.id,
        leave_type_id: lt.id,
        transaction_type: "accrual",
        days: lt.is_paid ? lt.days_per_year : 0,
        effective_date: "2026-01-01",
        description: `Annual leave accrual 2026 - ${lt.name}`,
      }));

      const { error } = await sb.from("leave_ledger").insert(entries);
      if (error) {
        console.error(`   ❌ ${emp.employee_code} ${emp.first_name}: ${error.message}`);
      } else {
        console.log(`   ✅ Seeded ${emp.employee_code} ${emp.first_name} ${emp.last_name}`);
      }
    } else {
      console.log(`   ✅ ${emp.employee_code} ${emp.first_name} ${emp.last_name}: already seeded`);
    }
  }

  console.log("\n✅ Done.");
}

main().catch(console.error);
