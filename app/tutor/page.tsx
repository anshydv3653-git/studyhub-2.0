import type { Metadata } from "next";
import AITutorChat from "../../components/AITutorChat";

const SITE_URL = "https://studyhub-2-0-five.vercel.app";

export const metadata: Metadata = {
  title: "Spark AI by Ansh – Personal AI Study Coach & Doubt Solver for CBSE Class 10 | StudyHub 2.0",
  description:
    "Ask doubts and get personalized CBSE Class 10 guidance with Spark AI by Ansh on StudyHub 2.0, synced with your syllabus and tracker.",
  alternates: {
    canonical: `${SITE_URL}/spark-ai`,
  },
  openGraph: {
    title: "Spark AI by Ansh – Personal AI Study Coach & Doubt Solver for CBSE Class 10 | StudyHub 2.0",
    description:
      "Ask doubts and get personalized CBSE Class 10 guidance with Spark AI by Ansh on StudyHub 2.0, synced with your syllabus and tracker.",
    url: `${SITE_URL}/spark-ai`,
    siteName: "StudyHub 2.0",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Spark AI by Ansh on StudyHub 2.0",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spark AI by Ansh – Personal AI Study Coach for CBSE Class 10",
    description:
      "Ask doubts and get personalized CBSE Class 10 guidance with Spark AI by Ansh on StudyHub 2.0, synced with your syllabus and tracker.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function TutorPage() {
  return <AITutorChat />;
}
