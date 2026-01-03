"use client";

import React, { useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { UserTotals } from "@/lib/copilotMetrics";

// ============================================================================
// USER DRAWER COMPONENT
// ============================================================================

interface UserDrawerProps {
  user: UserTotals | null;
  onClose: () => void;
}

export function UserDrawer({ user, onClose }: UserDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (user) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [user, onClose]);
  
  if (!user) return null;
  
  const acceptanceRate = user.totalGenerations > 0 
    ? ((user.totalAcceptances / user.totalGenerations) * 100).toFixed(1)
    : "0";
  
  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />
      
      {/* Drawer */}
      <div style={styles.drawer}>
        {/* Header */}
        <div style={styles.drawerHeader}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.login.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={styles.userName}>{user.login}</h2>
              <a 
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.userLink}
              >
                View GitHub Profile →
              </a>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <CloseIcon />
          </button>
        </div>
        
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <StatBox label="Total Prompts" value={user.totalPrompts} color="var(--chart-blue)" />
          <StatBox label="Generations" value={user.totalGenerations} color="var(--chart-purple)" />
          <StatBox label="Acceptances" value={user.totalAcceptances} color="var(--chart-green)" />
          <StatBox label="LOC Added" value={user.totalLocAdded} color="var(--chart-orange)" />
          <StatBox label="Acceptance Rate" value={`${acceptanceRate}%`} color="var(--accent-primary)" />
          <StatBox label="Active Days" value={user.days.filter(d => d.prompts > 0).length} color="var(--chart-cyan)" />
        </div>
        
        {/* Daily Activity Chart */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Daily Activity</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={user.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  stroke="var(--border-subtle)"
                />
                <YAxis 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  stroke="var(--border-subtle)"
                />
                <Tooltip 
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="prompts" 
                  stroke="var(--chart-blue)" 
                  name="Prompts"
                  dot={false}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="acceptances" 
                  stroke="var(--chart-green)" 
                  name="Acceptances"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* LOC Added Chart */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Lines of Code Added</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={user.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  stroke="var(--border-subtle)"
                />
                <YAxis 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  stroke="var(--border-subtle)"
                />
                <Tooltip 
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="locAdded" fill="var(--chart-orange)" name="LOC Added" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Feature Breakdown */}
        {user.featureBreakdown.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>By Feature</h3>
            <div style={styles.breakdownList}>
              {user.featureBreakdown.map((f) => (
                <div key={f.feature} style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>{f.feature}</span>
                  <span style={styles.breakdownValue}>{f.prompts.toLocaleString()} prompts</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* IDE Breakdown */}
        {user.ideBreakdown.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>By IDE</h3>
            <div style={styles.breakdownList}>
              {user.ideBreakdown.map((i) => (
                <div key={i.ide} style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>{i.ide}</span>
                  <span style={styles.breakdownValue}>{i.prompts.toLocaleString()} prompts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 200,
    animation: "fadeIn 0.2s ease-out",
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "480px",
    maxWidth: "100vw",
    background: "var(--bg-secondary)",
    borderLeft: "1px solid var(--border-subtle)",
    zIndex: 201,
    overflowY: "auto",
    animation: "slideIn 0.3s ease-out",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.5rem",
    borderBottom: "1px solid var(--border-subtle)",
    position: "sticky",
    top: 0,
    background: "var(--bg-secondary)",
    zIndex: 1,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "var(--accent-primary-muted)",
    color: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  userName: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  },
  userLink: {
    fontSize: "0.8125rem",
    color: "var(--accent-primary)",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "var(--radius-md)",
    background: "transparent",
    color: "var(--text-muted)",
    border: "none",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    padding: "1.5rem",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.75rem",
    background: "var(--bg-elevated)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
  },
  statLabel: {
    fontSize: "0.6875rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.125rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  section: {
    padding: "0 1.5rem 1.5rem",
  },
  sectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "0.75rem",
  },
  chartContainer: {
    background: "var(--bg-elevated)",
    borderRadius: "var(--radius-md)",
    padding: "1rem",
    border: "1px solid var(--border-subtle)",
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.625rem 0.75rem",
    background: "var(--bg-elevated)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
  },
  breakdownLabel: {
    fontSize: "0.8125rem",
    color: "var(--text-primary)",
    textTransform: "capitalize",
  },
  breakdownValue: {
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
    fontVariantNumeric: "tabular-nums",
  },
};
