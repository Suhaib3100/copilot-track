"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================================
// ICONS
// ============================================================================

const icons = {
  overview: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  timeline: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  ),
  features: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  copilot: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/>
    </svg>
  ),
};

// ============================================================================
// NAV ITEMS
// ============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/copilot-dashboard", label: "Overview", icon: icons.overview },
  { href: "/copilot-dashboard/users", label: "Users", icon: icons.users },
  { href: "/copilot-dashboard/timeline", label: "Timeline", icon: icons.timeline },
  { href: "/copilot-dashboard/features", label: "Features & IDEs", icon: icons.features },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside style={styles.sidebar}>
      {/* Logo / Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>{icons.copilot}</span>
        <div style={styles.brandText}>
          <span style={styles.brandTitle}>Copilot</span>
          <span style={styles.brandSubtitle}>Admin Console</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/copilot-dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {isActive && <span style={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div style={styles.sidebarFooter}>
        <div style={styles.footerText}>
          <span style={styles.footerLabel}>Powered by</span>
          <span style={styles.footerValue}>GitHub Copilot</span>
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: "var(--sidebar-width)",
    background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
    borderRight: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1.25rem 1rem",
    borderBottom: "1px solid var(--border-subtle)",
  },
  brandIcon: {
    color: "var(--accent-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  nav: {
    flex: 1,
    padding: "1rem 0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "all var(--transition-fast)",
    position: "relative",
  },
  navItemActive: {
    color: "var(--accent-primary)",
    background: "var(--accent-primary-muted)",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: "3px",
    height: "20px",
    background: "var(--accent-primary)",
    borderRadius: "2px 0 0 2px",
  },
  sidebarFooter: {
    padding: "1rem",
    borderTop: "1px solid var(--border-subtle)",
  },
  footerText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  footerLabel: {
    fontSize: "0.625rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  footerValue: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
  },
};
