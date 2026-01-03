"use client";

import React, { useState, useEffect } from "react";

const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "kingboii";
const AUTH_KEY = "copilot-dashboard-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check session storage for existing auth
    const authToken = sessionStorage.getItem(AUTH_KEY);
    if (authToken === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a slight delay for security feel
    setTimeout(() => {
      if (password === DASHBOARD_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, "authenticated");
        setIsAuthenticated(true);
      } else {
        setError("Incorrect password. Please try again.");
      }
      setIsLoading(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Show nothing while checking auth status
  if (isChecking) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <div style={styles.iconContainer}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={styles.lockIcon}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          
          <h1 style={styles.title}>Copilot Dashboard</h1>
          <p style={styles.subtitle}>Enter password to access the dashboard</p>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputContainer}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                style={styles.input}
                autoFocus
              />
            </div>
            
            {error && (
              <div style={styles.errorMessage}>
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonLoading : {}),
              }}
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
          
          <p style={styles.footer}>
            Protected by password authentication
          </p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-primary)",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid var(--border-subtle)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
    padding: "1rem",
  },
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    background: "var(--bg-secondary)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--border-subtle)",
    padding: "2.5rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    textAlign: "center" as const,
  },
  iconContainer: {
    width: "80px",
    height: "80px",
    margin: "0 auto 1.5rem",
    borderRadius: "var(--radius-full)",
    background: "var(--bg-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    color: "var(--accent)",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    margin: "0 0 2rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  inputContainer: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "0.9375rem",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box" as const,
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "rgba(239, 68, 68, 0.1)",
    borderRadius: "var(--radius-md)",
    fontSize: "0.8125rem",
    color: "#f87171",
  },
  button: {
    padding: "0.875rem 1.5rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    background: "var(--accent)",
    color: "#000",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "opacity 0.15s, transform 0.15s",
    marginTop: "0.5rem",
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  footer: {
    marginTop: "2rem",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
};
