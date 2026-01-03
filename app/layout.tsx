import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copilot Analytics Dashboard",
  description: "GitHub Copilot usage metrics analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
