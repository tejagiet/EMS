"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LeaveBalanceSummary } from "@ems/types";
import { ShieldAlert } from "lucide-react";

interface LeaveBalancesGridProps {
  balances: LeaveBalanceSummary[];
  onApplyLeave?: () => void;
}

export function LeaveBalancesGrid({ balances }: LeaveBalancesGridProps) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
          <ShieldAlert size={28} style={{ margin: "0 auto 8px" }} />
          <div>No leave policies configured for this organization yet.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}
    >
      {balances.map((b) => {
        const percentUsed = b.accruedDays > 0 ? Math.min(100, Math.round((b.usedDays / b.accruedDays) * 100)) : 0;

        return (
          <Card key={b.leaveTypeId}>
            <CardHeader style={{ paddingBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <div>
                  <CardTitle style={{ fontSize: "1rem" }}>{b.leaveTypeName}</CardTitle>
                  <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{b.leaveTypeCode}</code>
                </div>
                <Badge
                  label={b.isPaid ? "PAID" : "UNPAID"}
                  variant={b.isPaid ? "success" : "neutral"}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)" }}>
                  {b.availableDays}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>days available</span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "var(--border)",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percentUsed}%`,
                    background: percentUsed > 80 ? "var(--danger)" : "var(--primary)",
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Accrued: </span>
                  <strong>{b.accruedDays}d</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Used: </span>
                  <strong>{b.usedDays}d</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Pending: </span>
                  <strong>{b.pendingDays}d</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Annual Quota: </span>
                  <strong>{b.daysPerYear}d</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
