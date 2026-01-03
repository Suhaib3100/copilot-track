"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMetrics } from "../context/MetricsContext";

// ============================================================================
// DATE PRESETS
// ============================================================================

type PresetKey = "3days" | "7days" | "30days" | "custom";

interface DatePreset {
  key: PresetKey;
  label: string;
  getRange: () => { start: string; end: string };
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDatePresets(): DatePreset[] {
  const today = new Date();
  
  return [
    {
      key: "3days",
      label: "Last 3 Days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(today.getDate() - 2);
        return { start: formatDateISO(start), end: formatDateISO(today) };
      },
    },
    {
      key: "7days",
      label: "Last 7 Days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        return { start: formatDateISO(start), end: formatDateISO(today) };
      },
    },
    {
      key: "30days",
      label: "Last 30 Days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(today.getDate() - 29);
        return { start: formatDateISO(start), end: formatDateISO(today) };
      },
    },
    {
      key: "custom",
      label: "Custom Range",
      getRange: () => ({ start: "", end: "" }),
    },
  ];
}

// ============================================================================
// TOPBAR COMPONENT
// ============================================================================

export function TopBar() {
  const { 
    reportStartDay, 
    reportEndDay, 
    dateRange, 
    setDateRange,
    loading,
    error,
    refreshData,
  } = useMetrics();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>("custom");
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "Organization";
  const presets = getDatePresets();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Handle preset selection
  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset.key);
    
    if (preset.key === "custom") {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      const range = preset.getRange();
      // Clamp to report window
      const clampedStart = range.start < reportStartDay ? reportStartDay : range.start;
      const clampedEnd = range.end > reportEndDay ? reportEndDay : range.end;
      setDateRange({ start: clampedStart, end: clampedEnd });
      setIsOpen(false);
    }
  };
  
  // Apply custom date range
  const handleApplyCustom = () => {
    setIsOpen(false);
  };
  
  // Get display label for current selection
  const getDisplayLabel = () => {
    if (activePreset !== "custom") {
      const preset = presets.find(p => p.key === activePreset);
      return preset?.label || "Select Range";
    }
    return `${formatDisplayDate(dateRange.start)} - ${formatDisplayDate(dateRange.end)}`;
  };
  
  return (
    <header style={styles.topbar}>
      {/* Left: Org Info */}
      <div style={styles.leftSection}>
        <h1 style={styles.orgName}>{orgName}</h1>
        <StatusPill loading={loading} error={error} />
      </div>
      
      {/* Center: Date Range Picker */}
      <div style={styles.centerSection} ref={dropdownRef}>
        <div style={styles.datePickerWrapper}>
          {/* Main Button */}
          <button 
            style={styles.datePickerButton}
            onClick={() => setIsOpen(!isOpen)}
          >
            <CalendarIcon />
            <span style={styles.datePickerLabel}>{getDisplayLabel()}</span>
            <ChevronIcon open={isOpen} />
          </button>
          
          {/* Dropdown */}
          {isOpen && (
            <div style={styles.dropdown}>
              {/* Preset Options */}
              <div style={styles.presetList}>
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    style={{
                      ...styles.presetButton,
                      ...(activePreset === preset.key ? styles.presetButtonActive : {}),
                    }}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                    {activePreset === preset.key && preset.key !== "custom" && (
                      <CheckIcon />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom Date Inputs */}
              {showCustomInputs && (
                <div style={styles.customInputs}>
                  <div style={styles.customInputGroup}>
                    <label style={styles.customLabel}>Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      min={reportStartDay}
                      max={dateRange.end || reportEndDay}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      style={styles.customInput}
                    />
                  </div>
                  <div style={styles.customInputGroup}>
                    <label style={styles.customLabel}>End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      min={dateRange.start || reportStartDay}
                      max={reportEndDay}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      style={styles.customInput}
                    />
                  </div>
                  <button 
                    style={styles.applyButton}
                    onClick={handleApplyCustom}
                  >
                    Apply
                  </button>
                </div>
              )}
              
              {/* Report Window Info */}
              <div style={styles.dropdownFooter}>
                <span style={styles.footerLabel}>Available Data:</span>
                <span style={styles.footerDates}>
                  {formatDisplayDate(reportStartDay)} → {formatDisplayDate(reportEndDay)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right: Refresh Button */}
      <div style={styles.rightSection}>
        <button 
          onClick={refreshData} 
          style={styles.refreshButton}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshIcon spinning={loading} />
          <span style={styles.refreshLabel}>Refresh</span>
        </button>
      </div>
    </header>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusPill({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <span style={{ ...styles.statusPill, ...styles.statusLoading }}>
        <span style={styles.statusDot} />
        Loading...
      </span>
    );
  }
  
  if (error) {
    return (
      <span style={{ ...styles.statusPill, ...styles.statusError }}>
        <span style={{ ...styles.statusDot, background: "var(--error)" }} />
        Error
      </span>
    );
  }
  
  return (
    <span style={{ ...styles.statusPill, ...styles.statusSuccess }}>
      <span style={{ ...styles.statusDot, background: "var(--success)" }} />
      Live
    </span>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={spinning ? { animation: "spin 1s linear infinite" } : {}}
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ 
        transition: "transform 0.2s ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "...";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  topbar: {
    position: "fixed",
    top: 0,
    left: "var(--sidebar-width)",
    right: 0,
    height: "var(--topbar-height)",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border-subtle)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
    zIndex: 90,
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  orgName: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.25rem 0.625rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  statusLoading: {
    background: "var(--info-bg)",
    color: "var(--info)",
  },
  statusError: {
    background: "var(--error-bg)",
    color: "var(--error)",
  },
  statusSuccess: {
    background: "var(--success-bg)",
    color: "var(--success)",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "currentColor",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  datePickerWrapper: {
    position: "relative",
  },
  datePickerButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "var(--bg-primary)",
    padding: "0.5rem 0.875rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all var(--transition-fast)",
  },
  datePickerLabel: {
    minWidth: "150px",
    textAlign: "left",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    minWidth: "280px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    zIndex: 100,
    overflow: "hidden",
  },
  presetList: {
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  presetButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "0.625rem 0.75rem",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "all var(--transition-fast)",
  },
  presetButtonActive: {
    background: "var(--accent-primary)",
    color: "white",
  },
  customInputs: {
    padding: "0.75rem",
    borderTop: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  customInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  customLabel: {
    fontSize: "0.6875rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  customInput: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
  },
  applyButton: {
    marginTop: "0.25rem",
    padding: "0.5rem 1rem",
    background: "var(--accent-primary)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  dropdownFooter: {
    padding: "0.625rem 0.75rem",
    borderTop: "1px solid var(--border-subtle)",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontSize: "0.6875rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  footerDates: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono, monospace)",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.875rem",
    borderRadius: "var(--radius-md)",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-subtle)",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    transition: "all var(--transition-fast)",
  },
  refreshLabel: {
    color: "var(--text-secondary)",
  },
};
