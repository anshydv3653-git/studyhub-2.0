import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudyHub 2.0 — AI Study Tutor",
  description:
    "AI Study Tutor for CBSE Class 10 — powered by your real StudyHub tracker data.",
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
