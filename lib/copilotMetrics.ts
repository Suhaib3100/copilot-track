/**
 * Copilot Metrics Types and Fetching Logic
 * 
 * This module handles fetching and aggregating Copilot usage metrics
 * from GitHub's NDJSON exports.
 */

// ============================================================================
// TYPES
// ============================================================================

// Feature breakdown metrics
export interface FeatureMetrics {
  feature: string; // 'chat', 'completions', 'agent', 'edit', etc.
  prompts: number;
  generations: number;
  acceptances: number;
  locAdded: number;
}

// IDE breakdown metrics
export interface IDEMetrics {
  ide: string; // 'vscode', 'jetbrains', 'neovim', etc.
  prompts: number;
  generations: number;
  acceptances: number;
  locAdded: number;
}

// Language breakdown metrics
export interface LanguageMetrics {
  language: string;
  feature: string;
  prompts: number;
  generations: number;
  acceptances: number;
  locAdded: number;
}

// Raw NDJSON record from GitHub's Copilot metrics export
export interface RawCopilotRecord {
  day: string; // YYYY-MM-DD
  enterprise_id?: string;
  organization_id?: string;
  user_id?: string;
  user_login: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum?: number;
  loc_added_sum: number;
  loc_deleted_sum?: number;
  last_known_ide_version?: string;
  last_known_plugin_version?: string;
  totals_by_ide?: Record<string, {
    user_initiated_interaction_count?: number;
    code_generation_activity_count?: number;
    code_acceptance_activity_count?: number;
    loc_added_sum?: number;
  }>;
  totals_by_feature?: Record<string, {
    user_initiated_interaction_count?: number;
    code_generation_activity_count?: number;
    code_acceptance_activity_count?: number;
    loc_added_sum?: number;
  }>;
  totals_by_language_feature?: Record<string, {
    user_initiated_interaction_count?: number;
    code_generation_activity_count?: number;
    code_acceptance_activity_count?: number;
    loc_added_sum?: number;
  }>;
}

// Daily breakdown for a user
export interface DailyMetrics {
  day: string; // YYYY-MM-DD
  prompts: number;
  generations: number;
  acceptances: number;
  locAdded: number;
  byFeature?: FeatureMetrics[];
  byIDE?: IDEMetrics[];
  byLanguage?: LanguageMetrics[];
}

// Cost breakdown per user
export interface UserCost {
  seatCostUSD: number;
  premiumRequests: number;
  overageRequests: number;
  overageCostUSD: number;
  totalCostUSD: number;
  seatCostINR: number;
  overageCostINR: number;
  totalCostINR: number;
}

// Aggregated user totals
export interface UserTotals {
  login: string;
  totalPrompts: number;
  totalGenerations: number;
  totalAcceptances: number;
  totalLocAdded: number;
  acceptanceRate: number; // acceptances / generations
  days: DailyMetrics[];
  lastActiveDay?: string;
  featureBreakdown: FeatureMetrics[];
  ideBreakdown: IDEMetrics[];
  languageBreakdown: LanguageMetrics[];
  cost?: UserCost;
}

// Org-level cost totals
export interface OrgCost {
  totalSeatCostUSD: number;
  totalOverageCostUSD: number;
  totalCostUSD: number;
  totalSeatCostINR: number;
  totalOverageCostINR: number;
  totalCostINR: number;
  avgCostPerUserUSD: number;
  avgCostPerUserINR: number;
  avgCostPerActiveUserUSD: number;
  avgCostPerActiveUserINR: number;
}

// Cost configuration
export interface CostConfig {
  seatPriceUSD: number;
  includedPremiumRequests: number;
  premiumRequestPriceUSD: number;
  usdToINR: number;
}

// Org-level aggregations
export interface OrgTotals {
  totalUsers: number;
  activeUsers: number;
  totalPrompts: number;
  totalGenerations: number;
  totalAcceptances: number;
  totalLocAdded: number;
  avgPromptsPerUser: number;
  avgAcceptanceRate: number;
  featureBreakdown: FeatureMetrics[];
  ideBreakdown: IDEMetrics[];
  languageBreakdown: LanguageMetrics[];
  cost?: OrgCost;
}

// Admin recommendations
export interface AdminRecommendation {
  type: 'low-usage' | 'champion' | 'inactive' | 'review';
  title: string;
  description: string;
  users: string[];
  count: number;
}

// API response structure
export interface CopilotMetricsResponse {
  success: boolean;
  users: UserTotals[];
  orgTotals: OrgTotals;
  recommendations: AdminRecommendation[];
  reportStartDay?: string;
  reportEndDay?: string;
  costConfig?: CostConfig;
  error?: string;
}

// GitHub API response for download links
interface GitHubMetricsApiResponse {
  download_links: string[];
  report_start_day?: string;
  report_end_day?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parses feature breakdowns from a record
 */
function parseFeatureBreakdown(
  totals_by_feature?: RawCopilotRecord["totals_by_feature"]
): FeatureMetrics[] {
  if (!totals_by_feature) return [];
  
  return Object.entries(totals_by_feature).map(([feature, metrics]) => ({
    feature,
    prompts: metrics?.user_initiated_interaction_count || 0,
    generations: metrics?.code_generation_activity_count || 0,
    acceptances: metrics?.code_acceptance_activity_count || 0,
    locAdded: metrics?.loc_added_sum || 0,
  }));
}

/**
 * Parses IDE breakdowns from a record
 */
function parseIDEBreakdown(
  totals_by_ide?: RawCopilotRecord["totals_by_ide"]
): IDEMetrics[] {
  if (!totals_by_ide) return [];
  
  return Object.entries(totals_by_ide).map(([ide, metrics]) => ({
    ide,
    prompts: metrics?.user_initiated_interaction_count || 0,
    generations: metrics?.code_generation_activity_count || 0,
    acceptances: metrics?.code_acceptance_activity_count || 0,
    locAdded: metrics?.loc_added_sum || 0,
  }));
}

/**
 * Parses language breakdowns from a record
 */
function parseLanguageBreakdown(
  totals_by_language_feature?: RawCopilotRecord["totals_by_language_feature"]
): LanguageMetrics[] {
  if (!totals_by_language_feature) return [];
  
  return Object.entries(totals_by_language_feature).map(([key, metrics]) => {
    // Key format is typically "language:feature" or just "language"
    const [language, feature = "unknown"] = key.split(":");
    return {
      language,
      feature,
      prompts: metrics?.user_initiated_interaction_count || 0,
      generations: metrics?.code_generation_activity_count || 0,
      acceptances: metrics?.code_acceptance_activity_count || 0,
      locAdded: metrics?.loc_added_sum || 0,
    };
  });
}

/**
 * Merges feature metrics arrays
 */
function mergeFeatureMetrics(existing: FeatureMetrics[], incoming: FeatureMetrics[]): FeatureMetrics[] {
  const map = new Map<string, FeatureMetrics>();
  
  for (const m of existing) {
    map.set(m.feature, { ...m });
  }
  
  for (const m of incoming) {
    if (map.has(m.feature)) {
      const e = map.get(m.feature)!;
      e.prompts += m.prompts;
      e.generations += m.generations;
      e.acceptances += m.acceptances;
      e.locAdded += m.locAdded;
    } else {
      map.set(m.feature, { ...m });
    }
  }
  
  return Array.from(map.values());
}

/**
 * Merges IDE metrics arrays
 */
function mergeIDEMetrics(existing: IDEMetrics[], incoming: IDEMetrics[]): IDEMetrics[] {
  const map = new Map<string, IDEMetrics>();
  
  for (const m of existing) {
    map.set(m.ide, { ...m });
  }
  
  for (const m of incoming) {
    if (map.has(m.ide)) {
      const e = map.get(m.ide)!;
      e.prompts += m.prompts;
      e.generations += m.generations;
      e.acceptances += m.acceptances;
      e.locAdded += m.locAdded;
    } else {
      map.set(m.ide, { ...m });
    }
  }
  
  return Array.from(map.values());
}

/**
 * Merges language metrics arrays
 */
function mergeLanguageMetrics(existing: LanguageMetrics[], incoming: LanguageMetrics[]): LanguageMetrics[] {
  const map = new Map<string, LanguageMetrics>();
  
  for (const m of existing) {
    const key = `${m.language}:${m.feature}`;
    map.set(key, { ...m });
  }
  
  for (const m of incoming) {
    const key = `${m.language}:${m.feature}`;
    if (map.has(key)) {
      const e = map.get(key)!;
      e.prompts += m.prompts;
      e.generations += m.generations;
      e.acceptances += m.acceptances;
      e.locAdded += m.locAdded;
    } else {
      map.set(key, { ...m });
    }
  }
  
  return Array.from(map.values());
}

/**
 * Generates admin recommendations based on user data
 */
function generateRecommendations(users: UserTotals[]): AdminRecommendation[] {
  const recommendations: AdminRecommendation[] = [];
  
  // Low usage users (< 50 prompts total in 28 days)
  const lowUsageThreshold = 50;
  const lowUsageUsers = users.filter(u => u.totalPrompts > 0 && u.totalPrompts < lowUsageThreshold);
  if (lowUsageUsers.length > 0) {
    recommendations.push({
      type: 'low-usage',
      title: 'Seats to Review',
      description: `Users with fewer than ${lowUsageThreshold} prompts in the reporting period. Consider outreach or training.`,
      users: lowUsageUsers.map(u => u.login),
      count: lowUsageUsers.length,
    });
  }
  
  // Inactive users (0 prompts)
  const inactiveUsers = users.filter(u => u.totalPrompts === 0);
  if (inactiveUsers.length > 0) {
    recommendations.push({
      type: 'inactive',
      title: 'Inactive Seats',
      description: 'Users with no Copilot activity in the reporting period. Consider reassigning licenses.',
      users: inactiveUsers.map(u => u.login),
      count: inactiveUsers.length,
    });
  }
  
  // Champions (top 10% by prompts and high acceptance rate)
  const activeUsers = users.filter(u => u.totalPrompts > 0);
  const sortedByPrompts = [...activeUsers].sort((a, b) => b.totalPrompts - a.totalPrompts);
  const top10Percent = Math.max(1, Math.floor(sortedByPrompts.length * 0.1));
  const champions = sortedByPrompts.slice(0, top10Percent).filter(u => u.acceptanceRate > 0.4);
  if (champions.length > 0) {
    recommendations.push({
      type: 'champion',
      title: 'Copilot Champions',
      description: 'Top power users with high engagement and acceptance rates. Consider them for internal advocacy.',
      users: champions.map(u => u.login),
      count: champions.length,
    });
  }
  
  return recommendations;
}

/**
 * Computes org-level totals from user data
 */
function computeOrgTotals(users: UserTotals[]): OrgTotals {
  const activeUsers = users.filter(u => u.totalPrompts > 0);
  
  let featureBreakdown: FeatureMetrics[] = [];
  let ideBreakdown: IDEMetrics[] = [];
  let languageBreakdown: LanguageMetrics[] = [];
  
  let totalPrompts = 0;
  let totalGenerations = 0;
  let totalAcceptances = 0;
  let totalLocAdded = 0;
  let totalAcceptanceRate = 0;
  
  for (const user of users) {
    totalPrompts += user.totalPrompts;
    totalGenerations += user.totalGenerations;
    totalAcceptances += user.totalAcceptances;
    totalLocAdded += user.totalLocAdded;
    if (user.totalGenerations > 0) {
      totalAcceptanceRate += user.acceptanceRate;
    }
    
    featureBreakdown = mergeFeatureMetrics(featureBreakdown, user.featureBreakdown);
    ideBreakdown = mergeIDEMetrics(ideBreakdown, user.ideBreakdown);
    languageBreakdown = mergeLanguageMetrics(languageBreakdown, user.languageBreakdown);
  }
  
  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    totalPrompts,
    totalGenerations,
    totalAcceptances,
    totalLocAdded,
    avgPromptsPerUser: activeUsers.length > 0 ? Math.round(totalPrompts / activeUsers.length) : 0,
    avgAcceptanceRate: activeUsers.length > 0 ? totalAcceptanceRate / activeUsers.length : 0,
    featureBreakdown: featureBreakdown.sort((a, b) => b.prompts - a.prompts),
    ideBreakdown: ideBreakdown.sort((a, b) => b.prompts - a.prompts),
    languageBreakdown: languageBreakdown.sort((a, b) => b.locAdded - a.locAdded),
  };
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetches Copilot usage metrics from GitHub API
 */
export async function fetchCopilotMetrics(
  githubToken: string,
  orgSlug: string
): Promise<CopilotMetricsResponse> {
  const apiUrl = `https://api.github.com/orgs/${orgSlug}/copilot/metrics/reports/users-28-day/latest`;

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const emptyResponse: CopilotMetricsResponse = {
    success: false,
    users: [],
    orgTotals: {
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
    },
    recommendations: [],
  };

  try {
    // Step 1: Get download links from GitHub API
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} - ${errorText}`);
      
      // Provide more helpful error messages based on status code
      let errorMessage = `GitHub API returned ${response.status}: ${response.statusText}`;
      
      if (response.status === 404) {
        errorMessage = `Organization "${orgSlug}" not found or Copilot metrics not available. ` +
          `Please verify: (1) The organization name is correct, ` +
          `(2) Your organization has Copilot Business/Enterprise, ` +
          `(3) The "Copilot usage metrics" policy is enabled for the org, ` +
          `(4) Your PAT has "Organization Copilot metrics (read)" permission.`;
      } else if (response.status === 403) {
        errorMessage = `Access forbidden. Your PAT may not have the required permissions. ` +
          `Ensure it has "read:org" scope and "Organization Copilot metrics (read)" permission.`;
      } else if (response.status === 401) {
        errorMessage = `Authentication failed. Please check that your GITHUB_TOKEN is valid and not expired.`;
      }
      
      return {
        ...emptyResponse,
        error: errorMessage,
      };
    }

    const data: GitHubMetricsApiResponse = await response.json();

    if (!data.download_links || data.download_links.length === 0) {
      return {
        ...emptyResponse,
        error: "No download links available in the API response",
      };
    }

    // Step 2: Fetch and parse all NDJSON files
    const allRecords: RawCopilotRecord[] = [];

    for (const downloadUrl of data.download_links) {
      try {
        const ndjsonResponse = await fetch(downloadUrl);
        
        if (!ndjsonResponse.ok) {
          console.error(`Failed to fetch NDJSON: ${ndjsonResponse.status}`);
          continue;
        }

        const text = await ndjsonResponse.text();
        const lines = text.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const record = JSON.parse(line) as RawCopilotRecord;
            allRecords.push(record);
          } catch (parseError) {
            console.error("Failed to parse NDJSON line:", parseError);
          }
        }
      } catch (fetchError) {
        console.error(`Failed to fetch download URL: ${fetchError}`);
      }
    }

    // Step 3: Aggregate data by user
    const userMap = new Map<string, UserTotals>();

    for (const record of allRecords) {
      const login = record.user_login;
      
      if (!userMap.has(login)) {
        userMap.set(login, {
          login,
          totalPrompts: 0,
          totalGenerations: 0,
          totalAcceptances: 0,
          totalLocAdded: 0,
          acceptanceRate: 0,
          days: [],
          featureBreakdown: [],
          ideBreakdown: [],
          languageBreakdown: [],
        });
      }

      const user = userMap.get(login)!;

      // Parse breakdowns from record
      const featureMetrics = parseFeatureBreakdown(record.totals_by_feature);
      const ideMetrics = parseIDEBreakdown(record.totals_by_ide);
      const languageMetrics = parseLanguageBreakdown(record.totals_by_language_feature);

      // Add daily record
      const dailyMetrics: DailyMetrics = {
        day: record.day,
        prompts: record.user_initiated_interaction_count || 0,
        generations: record.code_generation_activity_count || 0,
        acceptances: record.code_acceptance_activity_count || 0,
        locAdded: record.loc_added_sum || 0,
        byFeature: featureMetrics,
        byIDE: ideMetrics,
        byLanguage: languageMetrics,
      };

      // Check if we already have this day (avoid duplicates)
      const existingDayIndex = user.days.findIndex((d) => d.day === record.day);
      if (existingDayIndex >= 0) {
        // Merge metrics for the same day
        const existingDay = user.days[existingDayIndex];
        existingDay.prompts += dailyMetrics.prompts;
        existingDay.generations += dailyMetrics.generations;
        existingDay.acceptances += dailyMetrics.acceptances;
        existingDay.locAdded += dailyMetrics.locAdded;
        existingDay.byFeature = mergeFeatureMetrics(existingDay.byFeature || [], featureMetrics);
        existingDay.byIDE = mergeIDEMetrics(existingDay.byIDE || [], ideMetrics);
        existingDay.byLanguage = mergeLanguageMetrics(existingDay.byLanguage || [], languageMetrics);
      } else {
        user.days.push(dailyMetrics);
      }

      // Update totals
      user.totalPrompts += dailyMetrics.prompts;
      user.totalGenerations += dailyMetrics.generations;
      user.totalAcceptances += dailyMetrics.acceptances;
      user.totalLocAdded += dailyMetrics.locAdded;
      
      // Merge breakdowns
      user.featureBreakdown = mergeFeatureMetrics(user.featureBreakdown, featureMetrics);
      user.ideBreakdown = mergeIDEMetrics(user.ideBreakdown, ideMetrics);
      user.languageBreakdown = mergeLanguageMetrics(user.languageBreakdown, languageMetrics);
      
      // Track last active day
      if (!user.lastActiveDay || record.day > user.lastActiveDay) {
        user.lastActiveDay = record.day;
      }
    }

    // Calculate acceptance rates and sort days for each user
    for (const user of userMap.values()) {
      user.acceptanceRate = user.totalGenerations > 0 
        ? user.totalAcceptances / user.totalGenerations 
        : 0;
      user.days.sort((a, b) => a.day.localeCompare(b.day));
    }

    // Convert to array and sort by total prompts descending
    const users = Array.from(userMap.values()).sort(
      (a, b) => b.totalPrompts - a.totalPrompts
    );

    // Compute org totals and recommendations
    const orgTotals = computeOrgTotals(users);
    const recommendations = generateRecommendations(users);

    return {
      success: true,
      users,
      orgTotals,
      recommendations,
      reportStartDay: data.report_start_day,
      reportEndDay: data.report_end_day,
    };
  } catch (error) {
    console.error("Error fetching Copilot metrics:", error);
    return {
      ...emptyResponse,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============================================================================
// AGGREGATION & FILTER FUNCTIONS
// ============================================================================

/**
 * Aggregates daily metrics across all users
 */
export function aggregateDailyTotals(users: UserTotals[]): (DailyMetrics & { activeUsers: number })[] {
  const dailyMap = new Map<string, DailyMetrics & { activeUsers: number }>();

  for (const user of users) {
    for (const day of user.days) {
      if (!dailyMap.has(day.day)) {
        dailyMap.set(day.day, {
          day: day.day,
          prompts: 0,
          generations: 0,
          acceptances: 0,
          locAdded: 0,
          activeUsers: 0,
          byFeature: [],
          byIDE: [],
          byLanguage: [],
        });
      }

      const daily = dailyMap.get(day.day)!;
      daily.prompts += day.prompts;
      daily.generations += day.generations;
      daily.acceptances += day.acceptances;
      daily.locAdded += day.locAdded;
      if (day.prompts > 0) daily.activeUsers += 1;
      
      // Merge breakdowns
      if (day.byFeature) {
        daily.byFeature = mergeFeatureMetrics(daily.byFeature || [], day.byFeature);
      }
      if (day.byIDE) {
        daily.byIDE = mergeIDEMetrics(daily.byIDE || [], day.byIDE);
      }
      if (day.byLanguage) {
        daily.byLanguage = mergeLanguageMetrics(daily.byLanguage || [], day.byLanguage);
      }
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.day.localeCompare(b.day)
  );
}

/**
 * Filters users and their daily data by date range
 */
export function filterByDateRange(
  users: UserTotals[],
  startDate?: string,
  endDate?: string
): UserTotals[] {
  if (!startDate && !endDate) {
    return users;
  }

  return users.map((user) => {
    const filteredDays = user.days.filter((day) => {
      if (startDate && day.day < startDate) return false;
      if (endDate && day.day > endDate) return false;
      return true;
    });

    // Recalculate totals based on filtered days
    const totalPrompts = filteredDays.reduce((sum, d) => sum + d.prompts, 0);
    const totalGenerations = filteredDays.reduce((sum, d) => sum + d.generations, 0);
    const totalAcceptances = filteredDays.reduce((sum, d) => sum + d.acceptances, 0);
    const totalLocAdded = filteredDays.reduce((sum, d) => sum + d.locAdded, 0);
    const acceptanceRate = totalGenerations > 0 ? totalAcceptances / totalGenerations : 0;

    // Recalculate breakdowns from filtered days
    let featureBreakdown: FeatureMetrics[] = [];
    let ideBreakdown: IDEMetrics[] = [];
    let languageBreakdown: LanguageMetrics[] = [];
    
    for (const day of filteredDays) {
      if (day.byFeature) featureBreakdown = mergeFeatureMetrics(featureBreakdown, day.byFeature);
      if (day.byIDE) ideBreakdown = mergeIDEMetrics(ideBreakdown, day.byIDE);
      if (day.byLanguage) languageBreakdown = mergeLanguageMetrics(languageBreakdown, day.byLanguage);
    }

    return {
      ...user,
      days: filteredDays,
      totalPrompts,
      totalGenerations,
      totalAcceptances,
      totalLocAdded,
      acceptanceRate,
      featureBreakdown,
      ideBreakdown,
      languageBreakdown,
    };
  }).filter((user) => user.days.length > 0);
}

/**
 * Filters users by various criteria
 */
export interface UserFilterOptions {
  searchQuery?: string;
  showActive?: boolean;
  showLowUsage?: boolean;
  showPowerUsers?: boolean;
  minPrompts?: number;
  minAcceptances?: number;
  minLocAdded?: number;
  lowUsageThreshold?: number;
  powerUserPromptsThreshold?: number;
  powerUserAcceptanceRateThreshold?: number;
}

export function filterUsers(users: UserTotals[], options: UserFilterOptions): UserTotals[] {
  let filtered = [...users];
  
  // Search by login
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filtered = filtered.filter(u => u.login.toLowerCase().includes(query));
  }
  
  // Filter by activity status
  if (options.showActive) {
    filtered = filtered.filter(u => u.totalPrompts > 0);
  }
  
  // Filter low usage users
  if (options.showLowUsage) {
    const threshold = options.lowUsageThreshold ?? 50;
    filtered = filtered.filter(u => u.totalPrompts > 0 && u.totalPrompts < threshold);
  }
  
  // Filter power users
  if (options.showPowerUsers) {
    const promptsThreshold = options.powerUserPromptsThreshold ?? 200;
    const acceptanceThreshold = options.powerUserAcceptanceRateThreshold ?? 0.4;
    filtered = filtered.filter(u => 
      u.totalPrompts >= promptsThreshold && u.acceptanceRate >= acceptanceThreshold
    );
  }
  
  // Apply minimum thresholds
  if (options.minPrompts !== undefined && options.minPrompts > 0) {
    filtered = filtered.filter(u => u.totalPrompts >= options.minPrompts!);
  }
  
  if (options.minAcceptances !== undefined && options.minAcceptances > 0) {
    filtered = filtered.filter(u => u.totalAcceptances >= options.minAcceptances!);
  }
  
  if (options.minLocAdded !== undefined && options.minLocAdded > 0) {
    filtered = filtered.filter(u => u.totalLocAdded >= options.minLocAdded!);
  }
  
  return filtered;
}

/**
 * Aggregates feature metrics across all users for a specific date range
 */
export function aggregateFeatureMetrics(users: UserTotals[]): FeatureMetrics[] {
  let result: FeatureMetrics[] = [];
  
  for (const user of users) {
    result = mergeFeatureMetrics(result, user.featureBreakdown);
  }
  
  return result.sort((a, b) => b.prompts - a.prompts);
}

/**
 * Aggregates IDE metrics across all users
 */
export function aggregateIDEMetrics(users: UserTotals[]): IDEMetrics[] {
  let result: IDEMetrics[] = [];
  
  for (const user of users) {
    result = mergeIDEMetrics(result, user.ideBreakdown);
  }
  
  return result.sort((a, b) => b.prompts - a.prompts);
}

/**
 * Aggregates language metrics across all users
 */
export function aggregateLanguageMetrics(users: UserTotals[]): LanguageMetrics[] {
  let result: LanguageMetrics[] = [];
  
  for (const user of users) {
    result = mergeLanguageMetrics(result, user.languageBreakdown);
  }
  
  return result.sort((a, b) => b.locAdded - a.locAdded);
}

// ============================================================================
// COST CALCULATION FUNCTIONS
// ============================================================================

/**
 * Default cost configuration
 */
export function getDefaultCostConfig(): CostConfig {
  return {
    seatPriceUSD: parseFloat(process.env.SEAT_PRICE_USD || "19"),
    includedPremiumRequests: parseInt(process.env.INCLUDED_PREMIUM_REQUESTS || "300", 10),
    premiumRequestPriceUSD: parseFloat(process.env.PREMIUM_REQUEST_PRICE_USD || "0.04"),
    usdToINR: parseFloat(process.env.USD_TO_INR || "83.50"),
  };
}

/**
 * Calculate cost for a single user
 */
export function calculateUserCost(user: UserTotals, config: CostConfig): UserCost {
  // Premium requests are approximated by user_initiated_interaction_count (prompts)
  // In a real scenario, GitHub may tag specific requests as "premium"
  const premiumRequests = user.totalPrompts;
  const overageRequests = Math.max(0, premiumRequests - config.includedPremiumRequests);
  const overageCostUSD = overageRequests * config.premiumRequestPriceUSD;
  const seatCostUSD = config.seatPriceUSD;
  const totalCostUSD = seatCostUSD + overageCostUSD;

  return {
    seatCostUSD,
    premiumRequests,
    overageRequests,
    overageCostUSD,
    totalCostUSD,
    seatCostINR: seatCostUSD * config.usdToINR,
    overageCostINR: overageCostUSD * config.usdToINR,
    totalCostINR: totalCostUSD * config.usdToINR,
  };
}

/**
 * Calculate costs for all users and add to their records
 */
export function calculateAllUserCosts(users: UserTotals[], config: CostConfig): UserTotals[] {
  return users.map(user => ({
    ...user,
    cost: calculateUserCost(user, config),
  }));
}

/**
 * Calculate org-level cost totals
 */
export function calculateOrgCost(users: UserTotals[], config: CostConfig): OrgCost {
  const usersWithCost = users.filter(u => u.cost);
  const activeUsers = users.filter(u => u.totalPrompts > 0);
  
  let totalSeatCostUSD = 0;
  let totalOverageCostUSD = 0;

  for (const user of usersWithCost) {
    if (user.cost) {
      totalSeatCostUSD += user.cost.seatCostUSD;
      totalOverageCostUSD += user.cost.overageCostUSD;
    }
  }

  const totalCostUSD = totalSeatCostUSD + totalOverageCostUSD;
  const avgCostPerUserUSD = users.length > 0 ? totalCostUSD / users.length : 0;
  const avgCostPerActiveUserUSD = activeUsers.length > 0 ? totalCostUSD / activeUsers.length : 0;

  return {
    totalSeatCostUSD,
    totalOverageCostUSD,
    totalCostUSD,
    totalSeatCostINR: totalSeatCostUSD * config.usdToINR,
    totalOverageCostINR: totalOverageCostUSD * config.usdToINR,
    totalCostINR: totalCostUSD * config.usdToINR,
    avgCostPerUserUSD,
    avgCostPerUserINR: avgCostPerUserUSD * config.usdToINR,
    avgCostPerActiveUserUSD,
    avgCostPerActiveUserINR: avgCostPerActiveUserUSD * config.usdToINR,
  };
}

/**
 * Recalculate costs with custom config (for simulator)
 */
export function recalculateCostsWithConfig(
  users: UserTotals[],
  customConfig: Partial<CostConfig>
): { users: UserTotals[]; orgCost: OrgCost } {
  const config: CostConfig = {
    ...getDefaultCostConfig(),
    ...customConfig,
  };

  const usersWithCost = calculateAllUserCosts(users, config);
  const orgCost = calculateOrgCost(usersWithCost, config);

  return { users: usersWithCost, orgCost };
}
