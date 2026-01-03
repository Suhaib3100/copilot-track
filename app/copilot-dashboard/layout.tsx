"use client";

import React from "react";
import { MetricsProvider } from "./context/MetricsContext";
import { Sidebar, TopBar } from "./components";
import AuthGuard from "./components/AuthGuard";

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MetricsProvider>
        <div style={styles.layout}>
          <Sidebar />
          <TopBar />
          <main style={styles.main}>
            {children}
          </main>
        </div>
      </MetricsProvider>
    </AuthGuard>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  layout: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
  },
  main: {
    marginLeft: "var(--sidebar-width)",
    paddingTop: "var(--topbar-height)",
    minHeight: "100vh",
  },
};
