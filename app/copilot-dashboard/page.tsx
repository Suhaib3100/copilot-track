"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  UserTotals,
  CopilotMetricsResponse,
  DailyMetrics,
  filterByDateRange,
  aggregateDailyTotals,
} from "@/lib/copilotMetrics";

type SortKey = "login" | "totalPrompts" | "totalGenerations" | "totalAcceptances" | "totalLocAdded";
type SortOrder = "asc" | "desc";

export default function CopilotDashboard() {
  const [data, setData] = useState<CopilotMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("totalPrompts");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/copilot-metrics");
        const result: CopilotMetricsResponse = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to fetch metrics");
        } else {
          setData(result);
          // Set default date range from the report
          if (result.reportStartDay) setStartDate(result.reportStartDay);
          if (result.reportEndDay) setEndDate(result.reportEndDay);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];

    const filtered = filterByDateRange(data.users, startDate, endDate);

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, startDate, endDate, sortKey, sortOrder]);

  // Aggregate daily totals
  const dailyTotals = useMemo(() => {
    return aggregateDailyTotals(filteredUsers);
  }, [filteredUsers]);

  // Summary stats
  const summary = useMemo(() => {
    const activeUsers = filteredUsers.filter((u) => u.totalPrompts > 0).length;
    const totalPrompts = filteredUsers.reduce((sum, u) => sum + u.totalPrompts, 0);
    const totalGenerations = filteredUsers.reduce((sum, u) => sum + u.totalGenerations, 0);
    const totalAcceptances = filteredUsers.reduce((sum, u) => sum + u.totalAcceptances, 0);
    const totalLocAdded = filteredUsers.reduce((sum, u) => sum + u.totalLocAdded, 0);

    return { activeUsers, totalPrompts, totalGenerations, totalAcceptances, totalLocAdded };
  }, [filteredUsers]);

  // Top 10 users for bar chart
  const top10Users = useMemo(() => {
    return [...filteredUsers]
      .sort((a, b) => b.totalPrompts - a.totalPrompts)
      .slice(0, 10)
      .map((u) => ({
        login: u.login,
        prompts: u.totalPrompts,
        acceptances: u.totalAcceptances,
        locAdded: u.totalLocAdded,
      }));
  }, [filteredUsers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return <span>{sortOrder === "asc" ? " ▲" : " ▼"}</span>;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading Copilot metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🤖 Copilot Analytics Dashboard</h1>
        {data?.reportStartDay && data?.reportEndDay && (
          <p style={styles.subtitle}>
            Report period: {data.reportStartDay} to {data.reportEndDay}
          </p>
        )}
      </header>

      {/* Date Filters */}
      <section style={styles.filterSection}>
        <h2 style={styles.sectionTitle}>📅 Date Filter</h2>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label htmlFor="startDate" style={styles.label}>Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.filterGroup}>
            <label htmlFor="endDate" style={styles.label}>End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <button
            onClick={() => {
              setStartDate(data?.reportStartDay || "");
              setEndDate(data?.reportEndDay || "");
            }}
            style={styles.resetButton}
          >
            Reset
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section style={styles.summarySection}>
        <h2 style={styles.sectionTitle}>📊 Summary</h2>
        <div style={styles.cardGrid}>
          <div style={styles.card}>
            <div style={styles.cardValue}>{summary.activeUsers}</div>
            <div style={styles.cardLabel}>Active Users</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardValue}>{summary.totalPrompts.toLocaleString()}</div>
            <div style={styles.cardLabel}>Total Prompts</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardValue}>{summary.totalGenerations.toLocaleString()}</div>
            <div style={styles.cardLabel}>Total Generations</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardValue}>{summary.totalAcceptances.toLocaleString()}</div>
            <div style={styles.cardLabel}>Total Acceptances</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardValue}>{summary.totalLocAdded.toLocaleString()}</div>
            <div style={styles.cardLabel}>Lines of Code Added</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section style={styles.chartsSection}>
        <h2 style={styles.sectionTitle}>📈 Charts</h2>
        <div style={styles.chartsGrid}>
          {/* Bar Chart - Top 10 Users */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Top 10 Users by Prompts</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10Users} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="login" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="prompts" fill="#3b82f6" name="Prompts" />
                  <Bar dataKey="acceptances" fill="#10b981" name="Acceptances" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart - Daily Prompts */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Daily Prompts (All Users)</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(5)} // MM-DD
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="prompts"
                    stroke="#3b82f6"
                    name="Prompts"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="acceptances"
                    stroke="#10b981"
                    name="Acceptances"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Lines of Code Added */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Lines of Code Added (Top 10 Users)</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10Users} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="login" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="locAdded" fill="#f59e0b" name="Lines Added" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>👥 Users ({filteredUsers.length})</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort("login")}>
                  Login <SortIndicator columnKey="login" />
                </th>
                <th style={styles.th} onClick={() => handleSort("totalPrompts")}>
                  Prompts <SortIndicator columnKey="totalPrompts" />
                </th>
                <th style={styles.th} onClick={() => handleSort("totalGenerations")}>
                  Generations <SortIndicator columnKey="totalGenerations" />
                </th>
                <th style={styles.th} onClick={() => handleSort("totalAcceptances")}>
                  Acceptances <SortIndicator columnKey="totalAcceptances" />
                </th>
                <th style={styles.th} onClick={() => handleSort("totalLocAdded")}>
                  LOC Added <SortIndicator columnKey="totalLocAdded" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.login} style={styles.tr}>
                  <td style={styles.td}>
                    <a
                      href={`https://github.com/${user.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {user.login}
                    </a>
                  </td>
                  <td style={styles.tdNumber}>{user.totalPrompts.toLocaleString()}</td>
                  <td style={styles.tdNumber}>{user.totalGenerations.toLocaleString()}</td>
                  <td style={styles.tdNumber}>{user.totalAcceptances.toLocaleString()}</td>
                  <td style={styles.tdNumber}>{user.totalLocAdded.toLocaleString()}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: "center" }}>
                    No users found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "0.875rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border)",
    borderTopColor: "var(--primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "1rem",
    padding: "2rem",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "var(--primary)",
    color: "white",
    padding: "0.5rem 1.5rem",
    borderRadius: "0.375rem",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  },
  filterSection: {
    marginBottom: "2rem",
    padding: "1.5rem",
    backgroundColor: "var(--card-bg)",
    borderRadius: "0.5rem",
    border: "1px solid var(--border)",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  filterRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.875rem",
    color: "var(--muted)",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "0.375rem",
    border: "1px solid var(--border)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  resetButton: {
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    border: "1px solid var(--border)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    cursor: "pointer",
  },
  summarySection: {
    marginBottom: "2rem",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    border: "1px solid var(--border)",
    textAlign: "center",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--primary)",
  },
  cardLabel: {
    fontSize: "0.875rem",
    color: "var(--muted)",
    marginTop: "0.25rem",
  },
  chartsSection: {
    marginBottom: "2rem",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  chartCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    border: "1px solid var(--border)",
  },
  chartTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  chartContainer: {
    width: "100%",
    height: "300px",
  },
  tableSection: {
    marginBottom: "2rem",
  },
  tableWrapper: {
    overflow: "auto",
    borderRadius: "0.5rem",
    border: "1px solid var(--border)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "var(--card-bg)",
  },
  th: {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "0.75rem 1rem",
  },
  tdNumber: {
    padding: "0.75rem 1rem",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
};
