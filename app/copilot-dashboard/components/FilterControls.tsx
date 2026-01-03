"use client";

import React from "react";
import { FilterState } from "../context/MetricsContext";

// ============================================================================
// FILTER CONTROLS COMPONENT
// ============================================================================

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  features?: string[];
  ides?: string[];
}

export function FilterControls({ 
  filters, 
  onFiltersChange, 
  onReset,
  features = [],
  ides = [],
}: FilterControlsProps) {
  const hasActiveFilters = Object.values(filters).some(v => 
    v !== undefined && v !== "" && v !== false && v !== 0
  );
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          <FilterIcon />
          Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={onReset} style={styles.resetButton}>
            Clear All
          </button>
        )}
      </div>
      
      <div style={styles.filtersGrid}>
        {/* Search */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search Users</label>
          <input
            type="text"
            placeholder="Search by login..."
            value={filters.searchQuery || ""}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            style={styles.searchInput}
          />
        </div>
        
        {/* User Type Toggle */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>User Type</label>
          <div style={styles.toggleGroup}>
            <button
              style={{
                ...styles.toggleButton,
                ...(filters.showActive ? styles.toggleButtonActive : {}),
              }}
              onClick={() => onFiltersChange({ 
                ...filters, 
                showActive: !filters.showActive,
                showLowUsage: false,
                showPowerUsers: false,
              })}
            >
              Active
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(filters.showLowUsage ? styles.toggleButtonActive : {}),
              }}
              onClick={() => onFiltersChange({ 
                ...filters, 
                showLowUsage: !filters.showLowUsage,
                showActive: false,
                showPowerUsers: false,
              })}
            >
              Low Usage
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(filters.showPowerUsers ? styles.toggleButtonActive : {}),
              }}
              onClick={() => onFiltersChange({ 
                ...filters, 
                showPowerUsers: !filters.showPowerUsers,
                showActive: false,
                showLowUsage: false,
              })}
            >
              Power Users
            </button>
          </div>
        </div>
        
        {/* Minimum Thresholds */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Min Prompts</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minPrompts || ""}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              minPrompts: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            style={styles.numberInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Min Acceptances</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minAcceptances || ""}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              minAcceptances: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            style={styles.numberInput}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Min LOC Added</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minLocAdded || ""}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              minLocAdded: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            style={styles.numberInput}
          />
        </div>
        
        {/* Feature Filter */}
        {features.length > 0 && (
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Feature</label>
            <select
              value={filters.feature || ""}
              onChange={(e) => onFiltersChange({ ...filters, feature: e.target.value || undefined })}
              style={styles.select}
            >
              <option value="">All Features</option>
              {features.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* IDE Filter */}
        {ides.length > 0 && (
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>IDE</label>
            <select
              value={filters.ide || ""}
              onChange={(e) => onFiltersChange({ ...filters, ide: e.target.value || undefined })}
              style={styles.select}
            >
              <option value="">All IDEs</option>
              {ides.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT FILTER BAR (for inline use)
// ============================================================================

interface CompactFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  children?: React.ReactNode;
}

export function CompactFilterBar({
  searchQuery,
  onSearchChange,
  sortOptions,
  sortValue,
  onSortChange,
  children,
}: CompactFilterBarProps) {
  return (
    <div style={styles.compactBar}>
      <div style={styles.compactSearch}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.compactSearchInput}
        />
      </div>
      
      {sortOptions && onSortChange && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          style={styles.compactSelect}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      
      {children}
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "var(--card-bg-solid)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  },
  resetButton: {
    background: "transparent",
    border: "none",
    color: "var(--accent-primary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  },
  filterLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  searchInput: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 0.75rem",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  },
  numberInput: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 0.75rem",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  },
  select: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 0.75rem",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    cursor: "pointer",
  },
  toggleGroup: {
    display: "flex",
    gap: "0.25rem",
  },
  toggleButton: {
    flex: 1,
    padding: "0.375rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    background: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  toggleButtonActive: {
    background: "var(--accent-primary-muted)",
    borderColor: "var(--accent-primary)",
    color: "var(--accent-primary)",
  },
  
  // Compact Filter Bar
  compactBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    background: "var(--card-bg-solid)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
  },
  compactSearch: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flex: 1,
    color: "var(--text-muted)",
  },
  compactSearchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
  },
  compactSelect: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "0.375rem 0.625rem",
    color: "var(--text-primary)",
    fontSize: "0.8125rem",
    outline: "none",
    cursor: "pointer",
  },
};
