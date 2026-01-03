import { NextResponse } from "next/server";
import { 
  fetchCopilotMetrics, 
  getDefaultCostConfig, 
  calculateAllUserCosts, 
  calculateOrgCost 
} from "@/lib/copilotMetrics";

export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;
  const orgSlug = process.env.ORG_SLUG;

  // Validate environment variables
  if (!githubToken) {
    console.error("GITHUB_TOKEN environment variable is not set");
    return NextResponse.json(
      {
        success: false,
        users: [],
        error: "Server configuration error: GITHUB_TOKEN is not set",
      },
      { status: 500 }
    );
  }

  if (!orgSlug) {
    console.error("ORG_SLUG environment variable is not set");
    return NextResponse.json(
      {
        success: false,
        users: [],
        error: "Server configuration error: ORG_SLUG is not set",
      },
      { status: 500 }
    );
  }

  try {
    const result = await fetchCopilotMetrics(githubToken, orgSlug);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Calculate costs for all users
    const costConfig = getDefaultCostConfig();
    const usersWithCost = calculateAllUserCosts(result.users, costConfig);
    const orgCost = calculateOrgCost(usersWithCost, costConfig);

    // Add cost to orgTotals
    const orgTotalsWithCost = {
      ...result.orgTotals,
      cost: orgCost,
    };

    return NextResponse.json({
      ...result,
      users: usersWithCost,
      orgTotals: orgTotalsWithCost,
      costConfig,
    });
  } catch (error) {
    console.error("Error in copilot-metrics API route:", error);
    return NextResponse.json(
      {
        success: false,
        users: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
