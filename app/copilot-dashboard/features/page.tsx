"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useMetrics } from "../context/MetricsContext";
import {
  ChartCard,
  KPICard,
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
  red: "#ef4444",
  indigo: "#6366f1",
  teal: "#14b8a6",
  yellow: "#eab308",
};

const CHART_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.purple,
  COLORS.orange,
  COLORS.pink,
  COLORS.cyan,
  COLORS.indigo,
  COLORS.teal,
];

// ============================================================================
// FEATURES PAGE COMPONENT
// ============================================================================

export default function FeaturesPage() {
  const {
    loading,
    error,
    featureMetrics,
    ideMetrics,
    languageMetrics,
    refreshData,
  } = useMetrics();
  
  const [activeTab, setActiveTab] = useState<"features" | "ides" | "languages">("features");
  
  // Feature chart data
  const featureChartData = useMemo(() => {
    return featureMetrics.map((f) => ({
      name: f.feature.charAt(0).toUpperCase() + f.feature.slice(1),
      prompts: f.prompts,
      acceptances: f.acceptances,
      locAdded: f.locAdded,
    }));
  }, [featureMetrics]);
  
  // IDE chart data
  const ideChartData = useMemo(() => {
    return ideMetrics.map((i) => ({
      name: i.ide,
      prompts: i.prompts,
      acceptances: i.acceptances,
      locAdded: i.locAdded,
    }));
  }, [ideMetrics]);
  
  // Language chart data
  const languageChartData = useMemo(() => {
    return languageMetrics.slice(0, 10).map((l) => ({
      name: l.language,
      prompts: l.prompts,
      acceptances: l.acceptances,
    }));
  }, [languageMetrics]);
  
  // Radar chart data for feature comparison
  const radarData = useMemo(() => {
    const maxPrompts = Math.max(...featureChartData.map(f => f.prompts), 1);
    const maxAcceptances = Math.max(...featureChartData.map(f => f.acceptances), 1);
    const maxLoc = Math.max(...featureChartData.map(f => f.locAdded), 1);
    
    return featureChartData.map((f) => ({
      feature: f.name,
      Prompts: (f.prompts / maxPrompts) * 100,
      Acceptances: (f.acceptances / maxAcceptances) * 100,
      "LOC Added": (f.locAdded / maxLoc) * 100,
    }));
  }, [featureChartData]);
  
  // Handle loading and error states
  if (loading) {
    return <LoadingState message="Loading feature data..." />;
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load features"
        message={error}
        onRetry={refreshData}
      />
    );
  }
  
  return (
    <div style={styles.page}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Features & IDEs</h1>
          <p style={styles.pageSubtitle}>
            Breakdown of Copilot usage by feature, IDE, and language
          </p>
        </div>
        <div style={styles.tabGroup}>
          <button
            style={activeTab === "features" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("features")}
          >
            Features
          </button>
          <button
            style={activeTab === "ides" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("ides")}
          >
            IDEs
          </button>
          <button
            style={activeTab === "languages" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("languages")}
          >
            Languages
          </button>
        </div>
      </div>
      
      {/* Features Tab */}
      {activeTab === "features" && (
        <>
          {/* Summary Cards */}
          <div style={styles.statsGrid}>
            {featureChartData.map((feature, idx) => (
              <KPICard
                key={feature.name}
                title={feature.name}
                value={feature.prompts.toLocaleString()}
                subtitle="prompts"
                icon={<FeatureIcon />}
                accentColor={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </div>
          
          {/* Charts */}
          <div style={styles.chartsGrid}>
            <ChartCard 
              title="Feature Comparison"
              subtitle="Prompts and acceptances by Copilot feature"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    stroke="var(--border-subtle)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="prompts" fill={COLORS.blue} name="Prompts" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="acceptances" fill={COLORS.green} name="Acceptances" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard 
              title="Feature Distribution"
              subtitle="Share of total prompts"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={featureChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="prompts"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--text-muted)" }}
                  >
                    {featureChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="var(--bg-primary)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard 
              title="Lines of Code by Feature"
              subtitle="AI-generated code by feature type"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={featureChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="locAdded" fill={COLORS.orange} name="LOC Added" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard 
              title="Feature Radar"
              subtitle="Relative performance across metrics"
            >
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Radar name="Prompts" dataKey="Prompts" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.2} />
                  <Radar name="Acceptances" dataKey="Acceptances" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.2} />
                  <Radar name="LOC Added" dataKey="LOC Added" stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
      
      {/* IDEs Tab */}
      {activeTab === "ides" && (
        <>
          {/* Summary Cards */}
          <div style={styles.statsGrid}>
            {ideChartData.slice(0, 4).map((ide, idx) => (
              <KPICard
                key={ide.name}
                title={ide.name}
                value={ide.prompts.toLocaleString()}
                subtitle="prompts"
                icon={<IDEIcon />}
                accentColor={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </div>
          
          {/* Charts */}
          <div style={styles.chartsGrid}>
            <ChartCard 
              title="IDE Usage Comparison"
              subtitle="Prompts and acceptances by IDE"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ideChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    stroke="var(--border-subtle)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="prompts" fill={COLORS.blue} name="Prompts" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="acceptances" fill={COLORS.green} name="Acceptances" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard 
              title="IDE Distribution"
              subtitle="Share of total usage"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ideChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="prompts"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--text-muted)" }}
                  >
                    {ideChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="var(--bg-primary)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
      
      {/* Languages Tab */}
      {activeTab === "languages" && (
        <>
          {/* Summary Cards */}
          <div style={styles.statsGrid}>
            {languageChartData.slice(0, 4).map((lang, idx) => (
              <KPICard
                key={lang.name}
                title={lang.name}
                value={lang.prompts.toLocaleString()}
                subtitle="prompts"
                icon={<LanguageIcon />}
                accentColor={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </div>
          
          {/* Charts */}
          <div style={styles.chartsGrid}>
            <ChartCard 
              title="Top Languages"
              subtitle="Prompts by programming language"
            >
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={languageChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    stroke="var(--border-subtle)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="prompts" fill={COLORS.purple} name="Prompts" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="acceptances" fill={COLORS.teal} name="Acceptances" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard 
              title="Language Distribution"
              subtitle="Share of prompts by language"
            >
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={languageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="prompts"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--text-muted)" }}
                  >
                    {languageChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="var(--bg-primary)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
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
// ICONS
// ============================================================================

function FeatureIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IDEIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

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
  tabGroup: {
    display: "flex",
    gap: "0.25rem",
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius-md)",
    padding: "0.25rem",
  },
  tab: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabActive: {
    padding: "0.5rem 1rem",
    background: "var(--bg-secondary)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.25rem",
  },
};
