"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMetrics } from "./context/MetricsContext";
import {
  KPICard,
  ChartCard,
  RecommendationCard,
  LoadingState,
  ErrorState,
} from "./components";
import { CostConfig } from "@/lib/copilotMetrics";

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
};

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.orange, COLORS.pink];

// ============================================================================
// OVERVIEW PAGE COMPONENT
// ============================================================================

export default function OverviewPage() {
  const {
    loading,
    error,
    filteredUsers,
    dailyTotals,
    orgTotals,
    recommendations,
    featureMetrics,
    refreshData,
    setSelectedUser,
    costConfig,
    simulatedCostConfig,
    setSimulatedCostConfig,
    simulatedOrgCost,
    simulatedUsers,
  } = useMetrics();
  
  // Cost simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simSeatPrice, setSimSeatPrice] = useState(costConfig?.seatPriceUSD || 19);
  const [simIncludedRequests, setSimIncludedRequests] = useState(costConfig?.includedPremiumRequests || 300);
  const [simRequestPrice, setSimRequestPrice] = useState(costConfig?.premiumRequestPriceUSD || 0.04);
  
  // Apply simulation
  const handleApplySimulation = () => {
    setSimulatedCostConfig({
      seatPriceUSD: simSeatPrice,
      includedPremiumRequests: simIncludedRequests,
      premiumRequestPriceUSD: simRequestPrice,
      usdToINR: costConfig?.usdToINR || 83.50,
    });
  };
  
  // Reset simulation
  const handleResetSimulation = () => {
    setSimulatedCostConfig(null);
    if (costConfig) {
      setSimSeatPrice(costConfig.seatPriceUSD);
      setSimIncludedRequests(costConfig.includedPremiumRequests);
      setSimRequestPrice(costConfig.premiumRequestPriceUSD);
    }
  };
  
  // Get effective cost data (simulated or actual)
  const effectiveOrgCost = simulatedOrgCost || orgTotals.cost;
  const isSimulated = !!simulatedCostConfig;
  
  // Top 10 users for bar chart
  const top10Users = useMemo(() => {
    return [...filteredUsers]
      .sort((a, b) => b.totalPrompts - a.totalPrompts)
      .slice(0, 10)
      .map((u) => ({
        login: u.login.length > 12 ? u.login.slice(0, 12) + "..." : u.login,
        fullLogin: u.login,
        prompts: u.totalPrompts,
        acceptances: u.totalAcceptances,
        locAdded: u.totalLocAdded,
      }));
  }, [filteredUsers]);
  
  // Feature distribution for pie chart
  const featureDistribution = useMemo(() => {
    return featureMetrics.slice(0, 5).map((f) => ({
      name: f.feature.charAt(0).toUpperCase() + f.feature.slice(1),
      value: f.prompts,
    }));
  }, [featureMetrics]);
  
  // Handle loading and error states
  if (loading) {
    return <LoadingState message="Loading Copilot metrics..." />;
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load metrics"
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
          <h1 style={styles.pageTitle}>Overview</h1>
          <p style={styles.pageSubtitle}>
            Organization-wide Copilot usage at a glance
          </p>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <section style={styles.kpiSection}>
        <div style={styles.kpiGrid}>
          <KPICard
            title="Active Users"
            value={orgTotals.activeUsers}
            subtitle={`of ${orgTotals.totalUsers} total seats`}
            icon={<UsersIcon />}
            accentColor={COLORS.blue}
          />
          <KPICard
            title="Avg Prompts / User"
            value={orgTotals.avgPromptsPerUser}
            subtitle="in selected period"
            icon={<ChatIcon />}
            accentColor={COLORS.purple}
          />
          <KPICard
            title="Total Acceptances"
            value={orgTotals.totalAcceptances}
            subtitle={`${((orgTotals.avgAcceptanceRate || 0) * 100).toFixed(0)}% avg acceptance rate`}
            icon={<CheckIcon />}
            accentColor={COLORS.green}
          />
          <KPICard
            title="AI Lines of Code"
            value={orgTotals.totalLocAdded}
            subtitle="added via Copilot"
            icon={<CodeIcon />}
            accentColor={COLORS.orange}
          />
        </div>
      </section>
      
      {/* Cost Analysis Section */}
      {effectiveOrgCost && (
        <section style={styles.costSection}>
          <div style={styles.costHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                💰 Cost Analysis {isSimulated && <span style={styles.simulatedBadge}>Simulated</span>}
              </h2>
              <p style={styles.sectionSubtitle}>Estimated monthly Copilot spend</p>
            </div>
            <button 
              style={styles.simulatorToggle}
              onClick={() => setShowSimulator(!showSimulator)}
            >
              {showSimulator ? "Hide Simulator" : "🧮 Open Simulator"}
            </button>
          </div>
          
          {/* Cost KPIs */}
          <div style={styles.costGrid}>
            <div style={styles.costCard}>
              <div style={styles.costCardHeader}>
                <span style={styles.costLabel}>Total Estimated Cost</span>
                <DollarIcon />
              </div>
              <div style={styles.costValue}>
                ${effectiveOrgCost.totalCostUSD.toFixed(2)}
              </div>
              <div style={styles.costInr}>
                ₹{effectiveOrgCost.totalCostINR.toFixed(2)}
              </div>
            </div>
            
            <div style={styles.costCard}>
              <div style={styles.costCardHeader}>
                <span style={styles.costLabel}>Seat Costs</span>
              </div>
              <div style={styles.costValue}>
                ${effectiveOrgCost.totalSeatCostUSD.toFixed(2)}
              </div>
              <div style={styles.costInr}>
                ₹{effectiveOrgCost.totalSeatCostINR.toFixed(2)}
              </div>
              <div style={styles.costNote}>
                {orgTotals.totalUsers} seats × ${costConfig?.seatPriceUSD || 19}
              </div>
            </div>
            
            <div style={styles.costCard}>
              <div style={styles.costCardHeader}>
                <span style={styles.costLabel}>Overage Costs</span>
              </div>
              <div style={{...styles.costValue, color: effectiveOrgCost.totalOverageCostUSD > 0 ? COLORS.orange : COLORS.green}}>
                ${effectiveOrgCost.totalOverageCostUSD.toFixed(2)}
              </div>
              <div style={styles.costInr}>
                ₹{effectiveOrgCost.totalOverageCostINR.toFixed(2)}
              </div>
              <div style={styles.costNote}>
                Premium requests beyond {costConfig?.includedPremiumRequests || 300}/user
              </div>
            </div>
            
            <div style={styles.costCard}>
              <div style={styles.costCardHeader}>
                <span style={styles.costLabel}>Cost per Active User</span>
              </div>
              <div style={styles.costValue}>
                ${effectiveOrgCost.avgCostPerActiveUserUSD.toFixed(2)}
              </div>
              <div style={styles.costInr}>
                ₹{effectiveOrgCost.avgCostPerActiveUserINR.toFixed(2)}
              </div>
              <div style={styles.costNote}>
                {orgTotals.activeUsers} active users
              </div>
            </div>
          </div>
          
          {/* Cost Simulator */}
          {showSimulator && (
            <div style={styles.simulator}>
              <h3 style={styles.simulatorTitle}>💡 What-If Simulator</h3>
              <p style={styles.simulatorDesc}>
                Adjust pricing parameters to see how costs would change
              </p>
              
              <div style={styles.simulatorGrid}>
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>
                    Seat Price (USD): <strong>${simSeatPrice}</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={simSeatPrice}
                    onChange={(e) => setSimSeatPrice(Number(e.target.value))}
                    style={styles.slider}
                  />
                </div>
                
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>
                    Included Premium Requests: <strong>{simIncludedRequests}</strong>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={simIncludedRequests}
                    onChange={(e) => setSimIncludedRequests(Number(e.target.value))}
                    style={styles.slider}
                  />
                </div>
                
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>
                    Premium Request Price (USD): <strong>${simRequestPrice.toFixed(2)}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.10"
                    step="0.01"
                    value={simRequestPrice}
                    onChange={(e) => setSimRequestPrice(Number(e.target.value))}
                    style={styles.slider}
                  />
                </div>
              </div>
              
              <div style={styles.simulatorActions}>
                <button style={styles.applyButton} onClick={handleApplySimulation}>
                  Apply Simulation
                </button>
                <button style={styles.resetButton} onClick={handleResetSimulation}>
                  Reset to Actual
                </button>
              </div>
            </div>
          )}
          
          {/* Top 5 Most Expensive Users */}
          <div style={styles.expensiveUsersSection}>
            <h3 style={styles.subsectionTitle}>Top 5 Most Expensive Users</h3>
            <div style={styles.expensiveUsersList}>
              {(isSimulated ? simulatedUsers : filteredUsers)
                .filter(u => u.cost)
                .sort((a, b) => (b.cost?.totalCostUSD || 0) - (a.cost?.totalCostUSD || 0))
                .slice(0, 5)
                .map((user, idx) => (
                  <div 
                    key={user.login} 
                    style={styles.expensiveUserRow}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div style={styles.expensiveUserRank}>#{idx + 1}</div>
                    <div style={styles.expensiveUserInfo}>
                      <span style={styles.expensiveUserName}>{user.login}</span>
                      <span style={styles.expensiveUserStats}>
                        {user.totalPrompts} prompts • {user.cost?.overageRequests || 0} overage
                      </span>
                    </div>
                    <div style={styles.expensiveUserCost}>
                      <span style={styles.expensiveUserUSD}>
                        ${user.cost?.totalCostUSD.toFixed(2)}
                      </span>
                      <span style={styles.expensiveUserINR}>
                        ₹{user.cost?.totalCostINR.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Charts Section */}
      <section style={styles.chartsSection}>
        <div style={styles.chartsGrid}>
          {/* Top Users Bar Chart */}
          <ChartCard 
            title="Top 10 Users by Prompts"
            subtitle="Click a bar to view user details"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={top10Users} 
                layout="vertical"
                onClick={(data) => {
                  const fullLogin = data?.activePayload?.[0]?.payload?.fullLogin;
                  if (fullLogin) {
                    const user = filteredUsers.find(
                      u => u.login === fullLogin
                    );
                    if (user) setSelectedUser(user);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <YAxis 
                  type="category" 
                  dataKey="login" 
                  width={100} 
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  stroke="var(--border-subtle)"
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--bg-hover)" }}
                />
                <Legend />
                <Bar dataKey="prompts" fill={COLORS.blue} name="Prompts" radius={[0, 4, 4, 0]} />
                <Bar dataKey="acceptances" fill={COLORS.green} name="Acceptances" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          
          {/* Daily Trends Line Chart */}
          <ChartCard 
            title="Daily Activity Trends"
            subtitle="Prompts and acceptances over time"
          >
            <ResponsiveContainer width="100%" height={300}>
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
            </ResponsiveContainer>
          </ChartCard>
          
          {/* Feature Distribution Pie Chart */}
          <ChartCard 
            title="Usage by Feature"
            subtitle="Distribution of prompts by feature type"
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={featureDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "var(--text-muted)" }}
                >
                  {featureDistribution.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="var(--bg-primary)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          
          {/* LOC Added Chart */}
          <ChartCard 
            title="Lines of Code Added"
            subtitle="Top 10 users by AI-generated code"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10Users} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border-subtle)" />
                <YAxis 
                  type="category" 
                  dataKey="login" 
                  width={100} 
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  stroke="var(--border-subtle)"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="locAdded" fill={COLORS.orange} name="LOC Added" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>
      
      {/* Admin Recommendations */}
      {recommendations.length > 0 && (
        <section style={styles.recommendationsSection}>
          <h2 style={styles.sectionTitle}>🎯 Admin Recommendations</h2>
          <div style={styles.recommendationsGrid}>
            {recommendations.map((rec, idx) => (
              <RecommendationCard
                key={idx}
                type={rec.type}
                title={rec.title}
                description={rec.description}
                count={rec.count}
                users={rec.users}
              />
            ))}
          </div>
        </section>
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

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
  kpiSection: {
    marginBottom: "2rem",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
  },
  // Cost Section Styles
  costSection: {
    marginBottom: "2rem",
    background: "var(--bg-secondary)",
    borderRadius: "var(--radius-lg)",
    padding: "1.5rem",
    border: "1px solid var(--border-subtle)",
  },
  costHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
  },
  sectionTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  sectionSubtitle: {
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
    marginTop: "0.25rem",
  },
  simulatedBadge: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    background: "var(--warning-bg)",
    color: "var(--warning)",
  },
  simulatorToggle: {
    padding: "0.5rem 1rem",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  costGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  costCard: {
    background: "var(--bg-primary)",
    borderRadius: "var(--radius-md)",
    padding: "1rem",
    border: "1px solid var(--border-subtle)",
  },
  costCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  costLabel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  costValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  costInr: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--accent-primary)",
    marginTop: "0.125rem",
  },
  costNote: {
    fontSize: "0.6875rem",
    color: "var(--text-muted)",
    marginTop: "0.375rem",
  },
  // Simulator Styles
  simulator: {
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius-md)",
    padding: "1.25rem",
    marginBottom: "1.25rem",
    border: "1px dashed var(--border-default)",
  },
  simulatorTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  },
  simulatorDesc: {
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
    marginTop: "0.25rem",
    marginBottom: "1rem",
  },
  simulatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1.5rem",
    marginBottom: "1rem",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  sliderLabel: {
    fontSize: "0.8125rem",
    color: "var(--text-secondary)",
  },
  slider: {
    width: "100%",
    accentColor: "var(--accent-primary)",
  },
  simulatorActions: {
    display: "flex",
    gap: "0.75rem",
  },
  applyButton: {
    padding: "0.5rem 1rem",
    background: "var(--accent-primary)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "white",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  resetButton: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  // Expensive Users
  expensiveUsersSection: {
    marginTop: "1rem",
  },
  subsectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.75rem",
  },
  expensiveUsersList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  expensiveUserRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 1rem",
    background: "var(--bg-primary)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  expensiveUserRank: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    width: "2rem",
  },
  expensiveUserInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  expensiveUserName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  expensiveUserStats: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  expensiveUserCost: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  expensiveUserUSD: {
    fontSize: "0.9375rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  expensiveUserINR: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--accent-primary)",
  },
  chartsSection: {
    marginBottom: "2rem",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.25rem",
  },
  recommendationsSection: {
    marginBottom: "2rem",
  },
  recommendationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1rem",
  },
};
