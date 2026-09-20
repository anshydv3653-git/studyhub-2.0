import type { Metadata } from "next";

const SITE_URL = "https://studyhub-2-0-five.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StudyHub 2.0 – CBSE Class 10 Notes, PYQs, NCERT Solutions & Spark AI by Ansh",
    template: "%s | StudyHub 2.0",
  },
  description:
    "Free CBSE Class 10 notes, PYQs and NCERT solutions on StudyHub 2.0, plus Spark AI by Ansh to solve doubts and personalize your board exam revision.",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "StudyHub 2.0 – CBSE Class 10 Notes, PYQs, NCERT Solutions & Spark AI by Ansh",
    description:
      "Free CBSE Class 10 notes, PYQs and NCERT solutions on StudyHub 2.0, plus Spark AI by Ansh to solve doubts and personalize your board exam revision.",
    url: SITE_URL,
    siteName: "StudyHub 2.0",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "StudyHub 2.0 | Spark AI by Ansh - CBSE Class 10 Study Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub 2.0 – CBSE Class 10 Notes & Spark AI by Ansh",
    description:
      "Free CBSE Class 10 notes, PYQs and NCERT solutions on StudyHub 2.0, plus Spark AI by Ansh to solve doubts and personalize your board exam revision.",
    images: [`${SITE_URL}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, background: "#131314" }}>{children}</body>
    </html>
  );
}
