import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";

export default function MobileDashboard() {
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState<string | null>(null);

  const handlePunchToggle = () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!punchedIn) {
      setPunchedIn(true);
      setPunchTime(now);
      Alert.alert("Clocked In", `Successfully punched in at ${now}`);
    } else {
      setPunchedIn(false);
      Alert.alert("Clocked Out", `Successfully punched out at ${now}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.collegeBadge}>GIET POLYTECHNIC · AI DEPT · TEAM T-1</Text>
          <Text style={styles.appTitle}>Employee Management</Text>
          <Text style={styles.subTitle}>EMS Mobile Portal</Text>
        </View>

        {/* Attendance Action Card */}
        <View style={styles.punchCard}>
          <Text style={styles.cardHeader}>Daily Attendance</Text>
          <Text style={styles.cardStatus}>
            Status:{" "}
            <Text style={{ color: punchedIn ? "#22c55e" : "#ef4444", fontWeight: "700" }}>
              {punchedIn ? `Punched In (${punchTime})` : "Not Clocked In"}
            </Text>
          </Text>
          <TouchableOpacity
            style={[styles.punchButton, { backgroundColor: punchedIn ? "#ef4444" : "#3b82f6" }]}
            onPress={handlePunchToggle}
          >
            <Text style={styles.punchButtonText}>
              {punchedIn ? "Punch Out" : "Punch In (Self Attendance)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Leave Balance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Pending Req</Text>
          </View>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Employee Actions</Text>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Apply Leave", "Leave application form is available.")}
        >
          <Text style={styles.menuTitle}>📝 Apply for Leave</Text>
          <Text style={styles.menuDesc}>Casual, Sick, or Earned leave</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Salary Slip", "Latest payslip for October 2026 is ready.")}
        >
          <Text style={styles.menuTitle}>💳 Payslips & Payroll</Text>
          <Text style={styles.menuDesc}>View and download monthly payslips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Staff Directory", "Connected to GIET Polytechnic directory.")}
        >
          <Text style={styles.menuTitle}>👥 Staff Directory</Text>
          <Text style={styles.menuDesc}>Search colleagues and departments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Sync Status", "Connected to Supabase Cloud Database.")}
        >
          <Text style={styles.menuTitle}>☁️ Cloud Sync Status</Text>
          <Text style={styles.menuDesc}>All local data synchronized</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>GIETP-AI-IT-EMS-T1-2026 · Batch 2024–2027</Text>
          <Text style={styles.footerSubText}>Lead: Teja · Ashok, Charan, Kula Shekhar, Jahnavi, Afsar</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    padding: 20,
    backgroundColor: "#0f172a",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  collegeBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#60a5fa",
    letterSpacing: 1,
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f8fafc",
  },
  subTitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  punchCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardStatus: {
    fontSize: 13,
    color: "#94a3b8",
    marginVertical: 10,
  },
  punchButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  punchButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#38bdf8",
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f8fafc",
  },
  menuDesc: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 65, 85, 0.4)",
  },
  footerText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  footerSubText: {
    fontSize: 10,
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
  },
});
