/**
 * GIET EMS Custom AI Agent Test Suite
 * Institution: GIET Polytechnic College | AI Department | Batch 2024–2027
 * Team: Team T-1 | Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

import { describe, expect, it } from "vitest";
import { GIETEMSAgent, gietAgent } from "../packages/shared/src/agents/giet-agent";
import { INSTITUTION } from "../packages/config/src";

describe("GIET EMS AI Operations Agent", () => {
  it("initializes with institutional attributes", () => {
    const agent = new GIETEMSAgent();
    expect(agent.name).toBe("GIET EMS Operations Agent");
    expect(agent.institution).toBe(INSTITUTION.name);
    expect(agent.department).toBe(INSTITUTION.department);
    expect(agent.publisherId).toBe(INSTITUTION.publisherId);
  });

  it("resolves role guidance for HR Manager", () => {
    const guidance = gietAgent.getRoleGuidance("hr_manager");
    expect(guidance.roleName).toBe("Human Resources");
    expect(guidance.defaultPath).toBe("/portal/hr");
    expect(guidance.description).toContain("lifecycle");
  });

  it("executes an attendance audit task successfully", async () => {
    const response = await gietAgent.executeTask({
      intent: "attendance_audit",
      payload: {},
      context: {
        organizationId: "giet-poly-org-01",
        userId: "user-teja-2401",
        userRole: "org_admin",
      },
    });

    expect(response.success).toBe(true);
    expect(response.agentName).toBe("GIET EMS Operations Agent");
    expect(response.institution).toBe(INSTITUTION.name);
    expect(response.data?.status).toBe("Compliant");
    expect(response.recommendedActions?.length).toBeGreaterThan(0);
  });

  it("validates leave policy against GIET limits", async () => {
    const response = await gietAgent.executeTask({
      intent: "leave_validation",
      payload: { daysRequested: 4 },
      context: {
        organizationId: "giet-poly-org-01",
        userId: "user-ashok-2402",
        userRole: "employee",
      },
    });

    expect(response.success).toBe(true);
    expect(response.data?.maxConsecutiveDays).toBe(5);
    expect(response.data?.requiresDepartmentHeadApproval).toBe(true);
  });

  it("handles payroll pre-reconciliation audit", async () => {
    const response = await gietAgent.executeTask({
      intent: "payroll_reconcile",
      payload: { month: "November 2026" },
      context: {
        organizationId: "giet-poly-org-01",
        userId: "user-charan-2403",
        userRole: "payroll_admin",
      },
    });

    expect(response.success).toBe(true);
    expect(response.data?.currency).toBe("INR");
    expect(response.data?.tenantIsolation).toBe("Strict");
  });
});
