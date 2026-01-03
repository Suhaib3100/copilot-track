"use client";

import React from "react";

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  accentColor?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon,
  accentColor = "var(--accent-primary)" 
}: KPICardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        {icon && (
          <span style={{ ...styles.cardIcon, color: accentColor }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ ...styles.cardValue, color: accentColor }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {(subtitle || trend) && (
        <div style={styles.cardFooter}>
          {subtitle && <span style={styles.cardSubtitle}>{subtitle}</span>}
          {trend && (
            <span style={{
              ...styles.cardTrend,
              color: trend.isPositive ? "var(--success)" : "var(--error)",
            }}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD (Smaller variant)
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color = "var(--text-primary)" }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ============================================================================
// RECOMMENDATION CARD
// ============================================================================

interface RecommendationCardProps {
  type: "low-usage" | "champion" | "inactive" | "review";
  title: string;
  description: string;
  count: number;
  users: string[];
  onViewUsers?: () => void;
}

export function RecommendationCard({ 
  type, 
  title, 
  description, 
  count, 
  users,
  onViewUsers 
}: RecommendationCardProps) {
  const config = {
    "low-usage": { color: "var(--warning)", bg: "var(--warning-bg)", icon: "⚠️" },
    "champion": { color: "var(--success)", bg: "var(--success-bg)", icon: "🏆" },
    "inactive": { color: "var(--error)", bg: "var(--error-bg)", icon: "💤" },
    "review": { color: "var(--info)", bg: "var(--info-bg)", icon: "👀" },
  };
  
  const { color, bg, icon } = config[type];
  
  return (
    <div style={{ ...styles.recCard, borderColor: color }}>
      <div style={styles.recHeader}>
        <span style={{ ...styles.recIcon, background: bg }}>{icon}</span>
        <div style={styles.recTitleWrapper}>
          <span style={styles.recTitle}>{title}</span>
          <span style={{ ...styles.recCount, color }}>{count} users</span>
        </div>
      </div>
      <p style={styles.recDescription}>{description}</p>
      <div style={styles.recUsers}>
        {users.slice(0, 5).map((user) => (
          <span key={user} style={styles.recUserChip}>{user}</span>
        ))}
        {users.length > 5 && (
          <span style={styles.recMoreUsers}>+{users.length - 5} more</span>
        )}
      </div>
      {onViewUsers && (
        <button onClick={onViewUsers} style={{ ...styles.recButton, color }}>
          View All Users →
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CHART CARD
// ============================================================================

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div>
          <h3 style={styles.chartTitle}>{title}</h3>
          {subtitle && <p style={styles.chartSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div style={styles.chartActions}>{actions}</div>}
      </div>
      <div style={styles.chartContent}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div style={styles.emptyState}>
      {icon && <div style={styles.emptyIcon}>{icon}</div>}
      <h3 style={styles.emptyTitle}>{title}</h3>
      {description && <p style={styles.emptyDescription}>{description}</p>}
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div style={styles.loadingState}>
      <div style={styles.spinner} />
      <p style={styles.loadingMessage}>{message}</p>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Error", message, onRetry }: ErrorStateProps) {
  return (
    <div style={styles.errorState}>
      <div style={styles.errorIcon}>❌</div>
      <h3 style={styles.errorTitle}>{title}</h3>
      <p style={styles.errorMessage}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.retryButton}>
          Try Again
        </button>
      )}
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  // KPI Card
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
    transition: "border-color var(--transition-fast)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  },
  cardTitle: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--text-muted)",
  },
  cardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.2,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "0.5rem",
  },
  cardSubtitle: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  cardTrend: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  
  // Stat Card
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "1rem",
    background: "var(--bg-elevated)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  statValue: {
    fontSize: "1.25rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  
  // Recommendation Card
  recCard: {
    background: "var(--card-bg-solid)",
    border: "1px solid",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
  },
  recHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  recIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.125rem",
  },
  recTitleWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  recTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  recCount: {
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  recDescription: {
    fontSize: "0.8125rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "0.75rem",
  },
  recUsers: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem",
    marginBottom: "0.75rem",
  },
  recUserChip: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    background: "var(--bg-hover)",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    fontFamily: "monospace",
  },
  recMoreUsers: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    alignSelf: "center",
  },
  recButton: {
    background: "transparent",
    border: "none",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
  },
  
  // Chart Card
  chartCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
  },
  chartHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  chartTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  },
  chartSubtitle: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "0.25rem",
  },
  chartActions: {
    display: "flex",
    gap: "0.5rem",
  },
  chartContent: {
    width: "100%",
    minHeight: "250px",
  },
  
  // Empty State
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
  },
  emptyDescription: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    maxWidth: "300px",
  },
  
  // Loading State
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid var(--border-subtle)",
    borderTopColor: "var(--accent-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingMessage: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
  },
  
  // Error State
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    padding: "2rem",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  errorTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
  },
  errorMessage: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    maxWidth: "500px",
    marginBottom: "1.5rem",
  },
  retryButton: {
    background: "var(--accent-primary)",
    color: "var(--bg-primary)",
    padding: "0.625rem 1.25rem",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  },
};
