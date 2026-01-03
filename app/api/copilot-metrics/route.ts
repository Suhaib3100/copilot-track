import { NextResponse } from "next/server";
import { fetchCopilotMetrics, generateMockData } from "@/lib/copilotMetrics";

export async function GET(request: Request) {
  // Check for mock mode via query param or env var
  const url = new URL(request.url);
  const useMock = url.searchParams.get("mock") === "true" || process.env.USE_MOCK_DATA === "true";
  
  if (useMock) {
    console.log("Using mock data for development/testing");
    return NextResponse.json(generateMockData());
  }

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

    return NextResponse.json(result);
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
