"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  CopilotMetricsResponse,
  UserTotals,
  DailyMetrics,
  OrgTotals,
  OrgCost,
  CostConfig,
  AdminRecommendation,
  FeatureMetrics,
  IDEMetrics,
  LanguageMetrics,
  filterByDateRange,
  filterUsers,
  aggregateDailyTotals,
  aggregateFeatureMetrics,
  aggregateIDEMetrics,
  aggregateLanguageMetrics,
  UserFilterOptions,
  recalculateCostsWithConfig,
} from "@/lib/copilotMetrics";

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterState extends UserFilterOptions {
  feature?: string;
  ide?: string;
}

interface MetricsContextValue {
  // Raw data
  rawData: CopilotMetricsResponse | null;
  loading: boolean;
  error: string | null;
  
  // Report window
  reportStartDay: string;
  reportEndDay: string;
  
  // Date range filter
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetDateRange: () => void;
  
  // User filters
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  
  // Filtered/computed data
  filteredUsers: UserTotals[];
  dailyTotals: (DailyMetrics & { activeUsers: number })[];
  orgTotals: OrgTotals;
  recommendations: AdminRecommendation[];
  featureMetrics: FeatureMetrics[];
  ideMetrics: IDEMetrics[];
  languageMetrics: LanguageMetrics[];
  
  // Cost data
  costConfig: CostConfig | null;
  simulatedCostConfig: CostConfig | null;
  setSimulatedCostConfig: (config: CostConfig | null) => void;
  simulatedOrgCost: OrgCost | null;
  simulatedUsers: UserTotals[];
  
  // Selected user for drawer
  selectedUser: UserTotals | null;
  setSelectedUser: (user: UserTotals | null) => void;
  
  // Actions
  refreshData: () => Promise<void>;
}

const defaultOrgTotals: OrgTotals = {
  totalUsers: 0,
  activeUsers: 0,
  totalPrompts: 0,
  totalGenerations: 0,
  totalAcceptances: 0,
  totalLocAdded: 0,
  avgPromptsPerUser: 0,
  avgAcceptanceRate: 0,
  featureBreakdown: [],
  ideBreakdown: [],
  languageBreakdown: [],
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  // Raw data state
  const [rawData, setRawData] = useState<CopilotMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Report window
  const [reportStartDay, setReportStartDay] = useState("");
  const [reportEndDay, setReportEndDay] = useState("");
  
  // Date range filter (within the report window)
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  
  // User filters
  const [filters, setFilters] = useState<FilterState>({});
  
  // Selected user for drawer
  const [selectedUser, setSelectedUser] = useState<UserTotals | null>(null);
  
  // Cost configuration
  const [costConfig, setCostConfig] = useState<CostConfig | null>(null);
  const [simulatedCostConfig, setSimulatedCostConfig] = useState<CostConfig | null>(null);
  
  // Fetch data on mount
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/copilot-metrics");
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || "Failed to fetch metrics");
        setRawData(null);
      } else {
        setRawData(result);
        
        // Set report window
        if (result.reportStartDay) setReportStartDay(result.reportStartDay);
        if (result.reportEndDay) setReportEndDay(result.reportEndDay);
        
        // Set cost config
        if (result.costConfig) setCostConfig(result.costConfig);
        
        // Initialize date range to full window
        setDateRange({
          start: result.reportStartDay || "",
          end: result.reportEndDay || "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setRawData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Reset date range to full report window
  const resetDateRange = useCallback(() => {
    setDateRange({ start: reportStartDay, end: reportEndDay });
  }, [reportStartDay, reportEndDay]);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  // Computed: filtered users (by date range and user filters)
  const filteredUsers = useMemo(() => {
    if (!rawData?.users) return [];
    
    // First filter by date range
    let users = filterByDateRange(rawData.users, dateRange.start, dateRange.end);
    
    // Then apply user filters
    users = filterUsers(users, filters);
    
    return users;
  }, [rawData, dateRange, filters]);
  
  // Computed: daily totals
  const dailyTotals = useMemo(() => {
    return aggregateDailyTotals(filteredUsers);
  }, [filteredUsers]);
  
  // Computed: org totals (recalculated from filtered users)
  const orgTotals = useMemo((): OrgTotals => {
    if (filteredUsers.length === 0) return defaultOrgTotals;
    
    const activeUsers = filteredUsers.filter(u => u.totalPrompts > 0);
    const totalPrompts = filteredUsers.reduce((sum, u) => sum + u.totalPrompts, 0);
    const totalGenerations = filteredUsers.reduce((sum, u) => sum + u.totalGenerations, 0);
    const totalAcceptances = filteredUsers.reduce((sum, u) => sum + u.totalAcceptances, 0);
    const totalLocAdded = filteredUsers.reduce((sum, u) => sum + u.totalLocAdded, 0);
    
    let totalAcceptanceRate = 0;
    for (const user of activeUsers) {
      if (user.totalGenerations > 0) {
        totalAcceptanceRate += user.acceptanceRate;
      }
    }
    
    return {
      totalUsers: filteredUsers.length,
      activeUsers: activeUsers.length,
      totalPrompts,
      totalGenerations,
      totalAcceptances,
      totalLocAdded,
      avgPromptsPerUser: activeUsers.length > 0 ? Math.round(totalPrompts / activeUsers.length) : 0,
      avgAcceptanceRate: activeUsers.length > 0 ? totalAcceptanceRate / activeUsers.length : 0,
      featureBreakdown: aggregateFeatureMetrics(filteredUsers),
      ideBreakdown: aggregateIDEMetrics(filteredUsers),
      languageBreakdown: aggregateLanguageMetrics(filteredUsers),
    };
  }, [filteredUsers]);
  
  // Computed: recommendations (from raw data, not affected by filters)
  const recommendations = useMemo(() => {
    return rawData?.recommendations || [];
  }, [rawData]);
  
  // Computed: aggregated feature metrics
  const featureMetrics = useMemo(() => {
    return aggregateFeatureMetrics(filteredUsers);
  }, [filteredUsers]);
  
  // Computed: aggregated IDE metrics
  const ideMetrics = useMemo(() => {
    return aggregateIDEMetrics(filteredUsers);
  }, [filteredUsers]);
  
  // Computed: aggregated language metrics
  const languageMetrics = useMemo(() => {
    return aggregateLanguageMetrics(filteredUsers);
  }, [filteredUsers]);
  
  // Computed: simulated costs (when simulator is active)
  const { simulatedOrgCost, simulatedUsers } = useMemo(() => {
    if (!simulatedCostConfig || !filteredUsers.length) {
      return { simulatedOrgCost: null, simulatedUsers: [] };
    }
    
    const result = recalculateCostsWithConfig(filteredUsers, simulatedCostConfig);
    return {
      simulatedOrgCost: result.orgCost,
      simulatedUsers: result.users,
    };
  }, [simulatedCostConfig, filteredUsers]);
  
  const value: MetricsContextValue = {
    rawData,
    loading,
    error,
    reportStartDay,
    reportEndDay,
    dateRange,
    setDateRange,
    resetDateRange,
    filters,
    setFilters,
    resetFilters,
    filteredUsers,
    dailyTotals,
    orgTotals,
    recommendations,
    featureMetrics,
    ideMetrics,
    languageMetrics,
    costConfig,
    simulatedCostConfig,
    setSimulatedCostConfig,
    simulatedOrgCost,
    simulatedUsers,
    selectedUser,
    setSelectedUser,
    refreshData: fetchData,
  };
  
  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useMetrics() {
  const context = useContext(MetricsContext);
  
  if (!context) {
    throw new Error("useMetrics must be used within a MetricsProvider");
  }
  
  return context;
}
