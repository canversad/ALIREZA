import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Intelligence — PoC",
  description:
    "Standalone proof of concept: AI-assisted content research workflow for marketing agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
