"use client";

import React, { useMemo, useState } from "react";
import { useMetrics } from "../context/MetricsContext";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  UserDrawer,
  CompactFilterBar,
} from "../components";
import { UserTotals } from "@/lib/copilotMetrics";

// ============================================================================
// TYPES
// ============================================================================

type SortKey = "login" | "totalPrompts" | "totalAcceptances" | "totalLocAdded" | "acceptanceRate" | "activeDays" | "seatCost" | "overageCost" | "totalCost";
type SortOrder = "asc" | "desc";

// ============================================================================
// USERS PAGE COMPONENT
// ============================================================================

export default function UsersPage() {
  const {
    loading,
    error,
    filteredUsers,
    refreshData,
    selectedUser,
    setSelectedUser,
    filters,
    setFilters,
  } = useMetrics();
  
  const [sortKey, setSortKey] = useState<SortKey>("totalPrompts");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // Sort users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      if (sortKey === "acceptanceRate") {
        aVal = a.totalPrompts > 0 ? a.totalAcceptances / a.totalPrompts : 0;
        bVal = b.totalPrompts > 0 ? b.totalAcceptances / b.totalPrompts : 0;
      } else if (sortKey === "activeDays") {
        aVal = a.days.length;
        bVal = b.days.length;
      } else if (sortKey === "seatCost") {
        aVal = a.cost?.seatCostUSD || 0;
        bVal = b.cost?.seatCostUSD || 0;
      } else if (sortKey === "overageCost") {
        aVal = a.cost?.overageCostUSD || 0;
        bVal = b.cost?.overageCostUSD || 0;
      } else if (sortKey === "totalCost") {
        aVal = a.cost?.totalCostUSD || 0;
        bVal = b.cost?.totalCostUSD || 0;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filteredUsers, sortKey, sortOrder]);
  
  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage]);
  
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  
  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };
  
  // Get sort indicator
  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };
  
  // Handle loading and error states
  if (loading) {
    return <LoadingState message="Loading user data..." />;
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load users"
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
          <h1 style={styles.pageTitle}>Users</h1>
          <p style={styles.pageSubtitle}>
            Browse and analyze individual user metrics
          </p>
        </div>
        <div style={styles.headerStats}>
          <span style={styles.statBadge}>
            {sortedUsers.length} users
          </span>
        </div>
      </div>
      
      {/* Filter Bar */}
      <CompactFilterBar
        searchQuery={filters.searchQuery || ""}
        onSearchChange={(q: string) => setFilters({ ...filters, searchQuery: q })}
      />
      
      {/* Users Table */}
      {sortedUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your filters or date range to see user data."
        />
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("login")}>
                    User{getSortIndicator("login")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("totalPrompts")}>
                    Prompts{getSortIndicator("totalPrompts")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("totalAcceptances")}>
                    Acceptances{getSortIndicator("totalAcceptances")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("acceptanceRate")}>
                    Rate{getSortIndicator("acceptanceRate")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("totalLocAdded")}>
                    LOC Added{getSortIndicator("totalLocAdded")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("activeDays")}>
                    Active Days{getSortIndicator("activeDays")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("seatCost")}>
                    Seat Cost{getSortIndicator("seatCost")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("overageCost")}>
                    Overage{getSortIndicator("overageCost")}
                  </th>
                  <th style={styles.thRight} onClick={() => handleSort("totalCost")}>
                    Total Cost{getSortIndicator("totalCost")}
                  </th>
                  <th style={styles.thCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <UserRow
                    key={user.login}
                    user={user}
                    onClick={() => setSelectedUser(user)}
                    isSelected={selectedUser?.login === user.login}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageButton}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                style={styles.pageButton}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
      
      {/* User Drawer */}
      <UserDrawer 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
}

// ============================================================================
// USER ROW COMPONENT
// ============================================================================

interface UserRowProps {
  user: UserTotals;
  onClick: () => void;
  isSelected: boolean;
}

function UserRow({ user, onClick, isSelected }: UserRowProps) {
  const acceptanceRate = user.totalPrompts > 0 
    ? ((user.totalAcceptances / user.totalPrompts) * 100).toFixed(0) 
    : "0";
  
  const activeDays = user.days.length;
  const isInactive = user.totalPrompts === 0;
  const isLowUsage = user.totalPrompts > 0 && user.totalPrompts < 10;
  const isPowerUser = user.totalPrompts >= 100;
  
  // Cost data
  const seatCostUSD = user.cost?.seatCostUSD || 0;
  const seatCostINR = user.cost?.seatCostINR || 0;
  const overageCostUSD = user.cost?.overageCostUSD || 0;
  const overageCostINR = user.cost?.overageCostINR || 0;
  const totalCostUSD = user.cost?.totalCostUSD || 0;
  const totalCostINR = user.cost?.totalCostINR || 0;
  
  return (
    <tr 
      style={{
        ...styles.tr,
        ...(isSelected ? styles.trSelected : {}),
      }}
      onClick={onClick}
    >
      <td style={styles.td}>
        <div style={styles.userCell}>
          <div style={styles.avatar}>
            {user.login.charAt(0).toUpperCase()}
          </div>
          <span style={styles.userName}>{user.login}</span>
        </div>
      </td>
      <td style={styles.tdRight}>{user.totalPrompts.toLocaleString()}</td>
      <td style={styles.tdRight}>{user.totalAcceptances.toLocaleString()}</td>
      <td style={styles.tdRight}>{acceptanceRate}%</td>
      <td style={styles.tdRight}>{user.totalLocAdded.toLocaleString()}</td>
      <td style={styles.tdRight}>{activeDays}</td>
      <td style={styles.tdRight}>
        <div style={styles.costCell}>
          <span style={styles.costUSD}>${seatCostUSD.toFixed(2)}</span>
          <span style={styles.costINR}>₹{seatCostINR.toFixed(0)}</span>
        </div>
      </td>
      <td style={styles.tdRight}>
        <div style={styles.costCell}>
          <span style={{...styles.costUSD, color: overageCostUSD > 0 ? "var(--warning)" : "var(--text-muted)"}}>
            ${overageCostUSD.toFixed(2)}
          </span>
          <span style={styles.costINR}>₹{overageCostINR.toFixed(0)}</span>
        </div>
      </td>
      <td style={styles.tdRight}>
        <div style={styles.costCell}>
          <span style={styles.costUSDTotal}>${totalCostUSD.toFixed(2)}</span>
          <span style={styles.costINRTotal}>₹{totalCostINR.toFixed(0)}</span>
        </div>
      </td>
      <td style={styles.tdCenter}>
        {isInactive && <span style={styles.badgeInactive}>Inactive</span>}
        {isLowUsage && <span style={styles.badgeLow}>Low Usage</span>}
        {isPowerUser && <span style={styles.badgePower}>Power User</span>}
        {!isInactive && !isLowUsage && !isPowerUser && <span style={styles.badgeNormal}>Active</span>}
      </td>
    </tr>
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
  headerStats: {
    display: "flex",
    gap: "0.75rem",
  },
  statBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.375rem 0.75rem",
    background: "var(--bg-tertiary)",
    borderRadius: "var(--radius-full)",
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
  },
  tableContainer: {
    background: "var(--bg-secondary)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    overflow: "hidden",
    marginTop: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.875rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  thRight: {
    textAlign: "right" as const,
    padding: "0.875rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  thCenter: {
    textAlign: "center" as const,
    padding: "0.875rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
  },
  tr: {
    borderBottom: "1px solid var(--border-subtle)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  trSelected: {
    background: "var(--bg-hover)",
  },
  td: {
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
  },
  tdRight: {
    textAlign: "right" as const,
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
  },
  tdCenter: {
    textAlign: "center" as const,
    padding: "0.75rem 1rem",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "var(--radius-full)",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  userName: {
    fontWeight: 500,
  },
  badgeInactive: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "var(--radius-full)",
    fontSize: "0.625rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
  },
  badgeLow: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "var(--radius-full)",
    fontSize: "0.625rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    background: "rgba(251, 191, 36, 0.15)",
    color: "#fbbf24",
  },
  badgePower: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "var(--radius-full)",
    fontSize: "0.625rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    background: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
  },
  badgeNormal: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "var(--radius-full)",
    fontSize: "0.625rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    background: "rgba(59, 130, 246, 0.15)",
    color: "#3b82f6",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "1.5rem",
  },
  pageButton: {
    padding: "0.5rem 1rem",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  pageInfo: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
  },
  costCell: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: "0.125rem",
  },
  costUSD: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
  },
  costINR: {
    fontSize: "0.625rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  costUSDTotal: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--success)",
    fontFamily: "var(--font-mono)",
  },
  costINRTotal: {
    fontSize: "0.625rem",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
  },
};
