import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        🤖 Copilot Analytics Dashboard
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", maxWidth: "600px" }}>
        Track your GitHub organization&apos;s Copilot usage metrics, including prompts, 
        code generations, acceptances, and lines of code added.
      </p>
      <Link 
        href="/copilot-dashboard"
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          padding: "0.75rem 2rem",
          borderRadius: "0.5rem",
          fontWeight: 500,
          transition: "background-color 0.2s"
        }}
      >
        View Dashboard →
      </Link>
    </main>
  );
}
