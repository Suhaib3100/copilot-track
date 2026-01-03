/**
 * Copilot Metrics Types and Fetching Logic
 * 
 * This module handles fetching and aggregating Copilot usage metrics
 * from GitHub's NDJSON exports.
 */

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
  totals_by_ide?: Record<string, unknown>;
  totals_by_feature?: Record<string, unknown>;
  totals_by_language_feature?: Record<string, unknown>;
}

// Daily breakdown for a user
export interface DailyMetrics {
  day: string; // YYYY-MM-DD
  prompts: number;
  generations: number;
  acceptances: number;
  locAdded: number;
}

// Aggregated user totals
export interface UserTotals {
  login: string;
  totalPrompts: number;
  totalGenerations: number;
  totalAcceptances: number;
  totalLocAdded: number;
  days: DailyMetrics[];
}

// API response structure
export interface CopilotMetricsResponse {
  success: boolean;
  users: UserTotals[];
  reportStartDay?: string;
  reportEndDay?: string;
  error?: string;
}

// GitHub API response for download links
interface GitHubMetricsApiResponse {
  download_links: string[];
  report_start_day?: string;
  report_end_day?: string;
}

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
        success: false,
        users: [],
        error: errorMessage,
      };
    }

    const data: GitHubMetricsApiResponse = await response.json();

    if (!data.download_links || data.download_links.length === 0) {
      return {
        success: false,
        users: [],
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
          days: [],
        });
      }

      const user = userMap.get(login)!;

      // Add daily record
      const dailyMetrics: DailyMetrics = {
        day: record.day,
        prompts: record.user_initiated_interaction_count || 0,
        generations: record.code_generation_activity_count || 0,
        acceptances: record.code_acceptance_activity_count || 0,
        locAdded: record.loc_added_sum || 0,
      };

      // Check if we already have this day (avoid duplicates)
      const existingDayIndex = user.days.findIndex((d) => d.day === record.day);
      if (existingDayIndex >= 0) {
        // Merge metrics for the same day
        user.days[existingDayIndex].prompts += dailyMetrics.prompts;
        user.days[existingDayIndex].generations += dailyMetrics.generations;
        user.days[existingDayIndex].acceptances += dailyMetrics.acceptances;
        user.days[existingDayIndex].locAdded += dailyMetrics.locAdded;
      } else {
        user.days.push(dailyMetrics);
      }

      // Update totals
      user.totalPrompts += dailyMetrics.prompts;
      user.totalGenerations += dailyMetrics.generations;
      user.totalAcceptances += dailyMetrics.acceptances;
      user.totalLocAdded += dailyMetrics.locAdded;
    }

    // Sort days for each user
    for (const user of userMap.values()) {
      user.days.sort((a, b) => a.day.localeCompare(b.day));
    }

    // Convert to array and sort by total prompts descending
    const users = Array.from(userMap.values()).sort(
      (a, b) => b.totalPrompts - a.totalPrompts
    );

    return {
      success: true,
      users,
      reportStartDay: data.report_start_day,
      reportEndDay: data.report_end_day,
    };
  } catch (error) {
    console.error("Error fetching Copilot metrics:", error);
    return {
      success: false,
      users: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Aggregates daily metrics across all users
 */
export function aggregateDailyTotals(users: UserTotals[]): DailyMetrics[] {
  const dailyMap = new Map<string, DailyMetrics>();

  for (const user of users) {
    for (const day of user.days) {
      if (!dailyMap.has(day.day)) {
        dailyMap.set(day.day, {
          day: day.day,
          prompts: 0,
          generations: 0,
          acceptances: 0,
          locAdded: 0,
        });
      }

      const daily = dailyMap.get(day.day)!;
      daily.prompts += day.prompts;
      daily.generations += day.generations;
      daily.acceptances += day.acceptances;
      daily.locAdded += day.locAdded;
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

    return {
      ...user,
      days: filteredDays,
      totalPrompts,
      totalGenerations,
      totalAcceptances,
      totalLocAdded,
    };
  }).filter((user) => user.days.length > 0);
}

/**
 * Generates mock data for testing the dashboard
 */
export function generateMockData(): CopilotMetricsResponse {
  const users = ["alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry", "ivy", "jack"];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 27);
  
  const mockUsers: UserTotals[] = users.map((login) => {
    const days: DailyMetrics[] = [];
    let totalPrompts = 0;
    let totalGenerations = 0;
    let totalAcceptances = 0;
    let totalLocAdded = 0;
    
    for (let i = 0; i < 28; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayStr = date.toISOString().split("T")[0];
      
      // Generate random but realistic metrics
      const prompts = Math.floor(Math.random() * 50) + 5;
      const generations = Math.floor(prompts * (0.8 + Math.random() * 0.4));
      const acceptances = Math.floor(generations * (0.3 + Math.random() * 0.5));
      const locAdded = Math.floor(acceptances * (5 + Math.random() * 15));
      
      days.push({ day: dayStr, prompts, generations, acceptances, locAdded });
      totalPrompts += prompts;
      totalGenerations += generations;
      totalAcceptances += acceptances;
      totalLocAdded += locAdded;
    }
    
    return { login, totalPrompts, totalGenerations, totalAcceptances, totalLocAdded, days };
  });
  
  // Sort by total prompts descending
  mockUsers.sort((a, b) => b.totalPrompts - a.totalPrompts);
  
  const reportStartDay = startDate.toISOString().split("T")[0];
  const reportEndDay = today.toISOString().split("T")[0];
  
  return {
    success: true,
    users: mockUsers,
    reportStartDay,
    reportEndDay,
  };
}
