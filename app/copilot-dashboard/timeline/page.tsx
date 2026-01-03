"use client";

import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
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
  ComposedChart,
} from "recharts";
import { useMetrics } from "../context/MetricsContext";
import {
  ChartCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components";

// ============================================================================
// CHART COLORS
// ============================================================================

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

// ============================================================================
// TIMELINE PAGE COMPONENT
// ============================================================================

export default function TimelinePage() {
  const {
    loading,
    error,
    dailyTotals,
    refreshData,
  } = useMetrics();
  
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");
  
  // Calculate cumulative totals
  const cumulativeData = useMemo(() => {
    let cumPrompts = 0;
    let cumAcceptances = 0;
    let cumLoc = 0;
    
    return dailyTotals.map((d) => {
      cumPrompts += d.prompts;
      cumAcceptances += d.acceptances;
      cumLoc += d.locAdded;
      
      return {
        ...d,
        cumPrompts,
        cumAcceptances,
        cumLoc,
      };
    });
  }, [dailyTotals]);
  
  // Calculate week-over-week trends
  const weeklyData = useMemo(() => {
    const weeks: { [key: string]: { prompts: number; acceptances: number; locAdded: number; activeUsers: number; days: number } } = {};
    
    dailyTotals.forEach((d) => {
      const date = new Date(d.day);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { prompts: 0, acceptances: 0, locAdded: 0, activeUsers: 0, days: 0 };
      }
      
      weeks[weekKey].prompts += d.prompts;
      weeks[weekKey].acceptances += d.acceptances;
      weeks[weekKey].locAdded += d.locAdded;
      weeks[weekKey].activeUsers += d.activeUsers;
      weeks[weekKey].days += 1;
    });
    
    return Object.entries(weeks)
      .map(([week, data]) => ({
        week: `Week of ${week}`,
        ...data,
        avgActiveUsers: Math.round(data.activeUsers / data.days),
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [dailyTotals]);
  
  // Handle loading and error states
  if (loading) {
    return <LoadingState message="Loading timeline data..." />;
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load timeline"
        message={error}
        onRetry={refreshData}
      />
    );
  }
  
  if (dailyTotals.length === 0) {
    return (
      <EmptyState
        title="No timeline data"
        description="No activity data found for the selected date range."
      />
    );
  }
  
  return (
    <div style={styles.page}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Timeline</h1>
          <p style={styles.pageSubtitle}>
            Track Copilot usage trends over time
          </p>
        </div>
        <div style={styles.chartTypeToggle}>
          <button
            style={chartType === "area" ? styles.toggleActive : styles.toggleButton}
            onClick={() => setChartType("area")}
          >
            Area
          </button>
          <button
            style={chartType === "line" ? styles.toggleActive : styles.toggleButton}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
          <button
            style={chartType === "bar" ? styles.toggleActive : styles.toggleButton}
            onClick={() => setChartType("bar")}
          >
            Bar
          </button>
        </div>
      </div>
      
      {/* Main Activity Chart */}
      <section style={styles.section}>
        <ChartCard 
          title="Daily Activity"
          subtitle="Prompts, acceptances, and lines of code added"
        >
          <ResponsiveContainer width="100%" height={350}>
            {chartType === "area" ? (
              <AreaChart data={dailyTotals}>
                <defs>
                  <linearGradient id="gradientPrompts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientAcceptances" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  stroke="var(--border-subtle)"
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="prompts" 
                  stroke={COLORS.blue}
                  fill="url(#gradientPrompts)"
                  name="Prompts"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="acceptances" 
                  stroke={COLORS.green}
                  fill="url(#gradientAcceptances)"
                  name="Acceptances"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartType === "line" ? (
              <LineChart data={dailyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  stroke="var(--border-subtle)"
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="prompts" 
                  stroke={COLORS.blue}
                  name="Prompts"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="acceptances" 
                  stroke={COLORS.green}
                  name="Acceptances"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="locAdded" 
                  stroke={COLORS.orange}
                  name="LOC Added"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={dailyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  stroke="var(--border-subtle)"
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="prompts" fill={COLORS.blue} name="Prompts" radius={[2, 2, 0, 0]} />
                <Bar dataKey="acceptances" fill={COLORS.green} name="Acceptances" radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </section>
      
      {/* Two-column charts */}
      <section style={styles.gridSection}>
        {/* Cumulative Growth */}
        <ChartCard 
          title="Cumulative Growth"
          subtitle="Running totals over the period"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                stroke="var(--border-subtle)"
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cumPrompts" 
                stroke={COLORS.blue}
                name="Total Prompts"
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="cumAcceptances" 
                stroke={COLORS.green}
                name="Total Acceptances"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Active Users */}
        <ChartCard 
          title="Daily Active Users"
          subtitle="Number of users with activity each day"
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={dailyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                stroke="var(--border-subtle)"
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="activeUsers" fill={COLORS.purple} name="Active Users" radius={[2, 2, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                stroke={COLORS.purple}
                strokeWidth={2}
                dot={false}
                name=" "
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
      
      {/* Weekly Summary */}
      {weeklyData.length > 1 && (
        <section style={styles.section}>
          <ChartCard 
            title="Weekly Summary"
            subtitle="Aggregated activity by week"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={(v) => v.replace("Week of ", "")}
                  stroke="var(--border-subtle)"
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="prompts" fill={COLORS.blue} name="Prompts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="acceptances" fill={COLORS.green} name="Acceptances" radius={[4, 4, 0, 0]} />
                <Bar dataKey="locAdded" fill={COLORS.orange} name="LOC Added" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
      )}
      
      {/* Acceptance Rate Trend */}
      <section style={styles.section}>
        <ChartCard 
          title="Acceptance Rate Trend"
          subtitle="Daily acceptance rate percentage"
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyTotals.map(d => ({
              ...d,
              acceptanceRate: d.prompts > 0 ? ((d.acceptances / d.prompts) * 100).toFixed(1) : 0,
            }))}>
              <defs>
                <linearGradient id="gradientRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                stroke="var(--border-subtle)"
              />
              <YAxis 
                tick={{ fill: "var(--text-muted)", fontSize: 11 }} 
                stroke="var(--border-subtle)"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}%`, "Acceptance Rate"]}
              />
              <Area 
                type="monotone" 
                dataKey="acceptanceRate" 
                stroke={COLORS.cyan}
                fill="url(#gradientRate)"
                name="Acceptance Rate"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}

// ============================================================================
// TOOLTIP STYLE
// ============================================================================

const tooltipStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-lg)",
};

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "1.5rem 2rem 3rem",
    maxWidth: "1600px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    marginTop: "0.25rem",
  },
  chartTypeToggle: {
    display: "flex",
    gap: "0.25rem",
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius-md)",
    padding: "0.25rem",
  },
  toggleButton: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  toggleActive: {
    padding: "0.5rem 1rem",
    background: "var(--bg-secondary)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  section: {
    marginBottom: "1.5rem",
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
};
