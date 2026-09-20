import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SparkAI — Intelligent CBSE Class 10 AI Tutor | StudyHub 2.0",
  description:
    "SparkAI: Your 24/7 CBSE Class 10 AI study coach powered by Gemini 2.5 Flash and synced with your StudyHub tracker.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#070810" }}>{children}</body>
    </html>
  );
}
