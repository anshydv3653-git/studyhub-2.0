import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Spark AI by Ansh – AI Study Assistant for CBSE Class 10 | StudyHub 2.0",
  },
  description:
    "Spark AI by Ansh on StudyHub 2.0 is an AI study assistant for CBSE Class 10 to clear doubts, get NCERT solutions, and revise for board exams.",
  alternates: {
    canonical: "https://studyhub-2-0-five.vercel.app/spark-ai",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Spark AI by Ansh – AI Study Assistant for CBSE Class 10 | StudyHub 2.0",
    description:
      "Spark AI by Ansh on StudyHub 2.0 is an AI study assistant for CBSE Class 10 to clear doubts, get NCERT solutions, and revise for board exams.",
    url: "https://studyhub-2-0-five.vercel.app/spark-ai",
    siteName: "StudyHub 2.0",
    images: [
      {
        url: "https://studyhub-2-0-five.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spark AI by Ansh – AI Study Assistant for CBSE Class 10 on StudyHub 2.0",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spark AI by Ansh – AI Study Assistant for CBSE Class 10 | StudyHub 2.0",
    description:
      "Spark AI by Ansh on StudyHub 2.0 is an AI study assistant for CBSE Class 10 to clear doubts, get NCERT solutions, and revise for board exams.",
    images: ["https://studyhub-2-0-five.vercel.app/og-image.png"],
  },
};

export default function SparkAIPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://studyhub-2-0-five.vercel.app/#website",
        "name": "StudyHub 2.0",
        "url": "https://studyhub-2-0-five.vercel.app/",
        "inLanguage": "en-IN",
        "description":
          "Free CBSE Class 10 notes, PYQs and NCERT solutions on StudyHub 2.0, plus Spark AI by Ansh to solve doubts and personalize your board exam revision.",
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://studyhub-2-0-five.vercel.app/#organization",
        "name": "StudyHub 2.0",
        "url": "https://studyhub-2-0-five.vercel.app/",
        "logo": "https://studyhub-2-0-five.vercel.app/og-image.png",
        "sameAs": ["https://instagram.com/build_with_ansh"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://studyhub-2-0-five.vercel.app/#spark-ai",
        "name": "Spark AI",
        "alternateName": "Spark AI by Ansh",
        "url": "https://studyhub-2-0-five.vercel.app/spark-ai",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All Web Browsers",
        "creator": {
          "@type": "Person",
          "name": "Ansh",
        },
        "publisher": {
          "@type": "Organization",
          "name": "StudyHub 2.0",
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "description":
          "Spark AI by Ansh is an AI study assistant that explains Class 10 topics, solves doubts step by step, and reads uploaded notes, images and PDFs.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://studyhub-2-0-five.vercel.app/spark-ai#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Spark AI by Ansh on StudyHub 2.0?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Spark AI by Ansh is an AI study assistant that explains Class 10 topics, solves doubts step by step, and reads uploaded notes, images and PDFs on StudyHub 2.0.",
            },
          },
          {
            "@type": "Question",
            "name": "How does Spark AI help CBSE Class 10 students prepare for Board Exams?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Spark AI CBSE Class 10 assistant provides structured explanations calibrated to the NCERT curriculum, helps practice high-weightage questions, clarifies scientific diagrams, and guides problem-solving.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I upload textbook photos, question papers, and PDFs to Spark AI?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, Spark AI supports image and PDF uploads up to 4MB each. You can snap a photo of any tough Math problem or Science diagram and get an instant step-by-step breakdown using Gemini 2.5 Flash.",
            },
          },
          {
            "@type": "Question",
            "name": "Is Spark AI on StudyHub 2.0 completely free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, Spark AI StudyHub access is 100% free for students along with full access to CBSE Class 10 notes PYQ NCERT solutions free on the platform.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I ask questions in Hinglish or English?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, Spark AI is fluent in English, Hindi, and conversational Hinglish, making explanations relatable, comfortable, and easy to grasp.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ minHeight: "100vh", background: "#0c0a09", color: "#f5f5f4", fontFamily: "sans-serif" }}>
        {/* Navigation */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1120px", margin: "0 auto" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f43f5e" }}>⚡</span> Study<em>Hub</em> 2.0
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ color: "#a8a29e", textDecoration: "none", fontSize: "0.92rem", fontWeight: 600 }}>Home</Link>
            <Link href="/#notes" style={{ color: "#a8a29e", textDecoration: "none", fontSize: "0.92rem", fontWeight: 600 }}>Notes & Solutions</Link>
            <Link href="/tutor" style={{ background: "linear-link(135deg, #e11d48, #be123c)", backgroundColor: "#e11d48", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 700 }}>
              Open Spark AI Chat
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "64px 20px 80px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(225, 29, 72, 0.12)", border: "1px solid rgba(225, 29, 72, 0.3)", borderRadius: "999px", padding: "6px 14px", fontSize: "0.84rem", fontWeight: 700, color: "#fda4af", marginBottom: "20px" }}>
            <span>⚡ Built by Ansh for CBSE Class 10</span>
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "20px" }}>
            Spark AI by Ansh – AI Study Assistant for CBSE Class 10
          </h1>

          <p style={{ fontSize: "1.18rem", lineHeight: 1.6, color: "#d6d3d1", marginBottom: "28px" }}>
            Welcome to <strong>Spark AI StudyHub</strong> — an AI study assistant that explains Class 10 topics, solves doubts step by step, and reads uploaded notes, images and PDFs. Designed specifically for <strong>StudyHub 2.0 CBSE Class 10</strong> learners preparing for board examinations.
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "48px" }}>
            <Link
              href="/tutor"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                color: "#fff",
                textDecoration: "none",
                padding: "14px 30px",
                borderRadius: "999px",
                fontSize: "1.05rem",
                fontWeight: 800,
                boxShadow: "0 10px 25px -5px rgba(225, 29, 72, 0.5)",
              }}
            >
              Open Spark AI chat 🚀
            </Link>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#e7e5e4",
                textDecoration: "none",
                padding: "14px 24px",
                borderRadius: "999px",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            >
              Explore Free Notes & PYQs
            </Link>
          </div>

          {/* Core Content */}
          <section style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "40px", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "16px", color: "#fff" }}>
              How Spark AI CBSE Class 10 Powers Your Board Exam Revision
            </h2>
            <p style={{ lineHeight: 1.7, color: "#a8a29e", marginBottom: "16px" }}>
              Studying for CBSE Class 10 boards requires clarity, conceptual depth, and structured problem-solving. While textbooks and sample papers provide the syllabus, students frequently get stuck on tricky mathematical steps, chemical equation balancing, or biological diagram labeling.
            </p>
            <p style={{ lineHeight: 1.7, color: "#a8a29e", marginBottom: "16px" }}>
              With <strong>Spark AI CBSE Class 10</strong>, you get round-the-clock guidance directly aligned with the official NCERT syllabus. You can ask doubts in simple English, Hindi, or conversational Hinglish. Whether you want a simplified breakdown of Ohm’s Law, step-by-step solutions for quadratic equations, or important keywords for Social Science board answers, Spark AI provides clear and concise explanations.
            </p>
          </section>

          {/* Capabilities Grid */}
          <section style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "20px", color: "#fff" }}>
              Key Features of Spark AI by Ansh
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>📸</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>Photo & PDF Uploads</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#a8a29e" }}>
                  Upload photos of textbook problems, handwritten notes, or past exam papers up to 4MB. Powered by Gemini 2.5 Flash for accurate OCR and diagram understanding.
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>⚡</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>Dual Model Intelligence</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#a8a29e" }}>
                  Seamlessly toggle between Gemini 2.5 Flash for multi-modal visual analysis and GPT-OSS 120B for deep reasoning and detailed subject breakdowns.
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "22px" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>📚</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>CBSE Class 10 Integration</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#a8a29e" }}>
                  Connected directly to StudyHub 2.0 where you can access <strong>CBSE Class 10 notes PYQ NCERT solutions free</strong> across Science, Mathematics, SST, English, and Hindi.
                </p>
              </div>
            </div>
          </section>

          {/* Real Prompt Examples */}
          <section style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "16px", color: "#fff" }}>
              Examples of Questions You Can Ask Spark AI
            </h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 18px", borderRadius: "12px", color: "#e7e5e4", fontSize: "0.95rem" }}>
                💡 <em>&quot;Explain the difference between calcination and roasting with chemical reactions.&quot;</em>
              </li>
              <li style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 18px", borderRadius: "12px", color: "#e7e5e4", fontSize: "0.95rem" }}>
                📐 <em>&quot;Solve this Arithmetic Progression word problem step by step: The 17th term of an AP exceeds its 10th term by 7...&quot;</em>
              </li>
              <li style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 18px", borderRadius: "12px", color: "#e7e5e4", fontSize: "0.95rem" }}>
                🌍 <em>&quot;What were the main causes of the Non-Cooperation Movement? Give me 5 crisp board exam points.&quot;</em>
              </li>
              <li style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 18px", borderRadius: "12px", color: "#e7e5e4", fontSize: "0.95rem" }}>
                📅 <em>&quot;How should I plan my study timetable for the last 30 days before CBSE Class 10 Science boards?&quot;</em>
              </li>
            </ul>
          </section>

          {/* Internal Links back to StudyHub resources */}
          <section style={{ background: "rgba(225, 29, 72, 0.05)", border: "1px solid rgba(225, 29, 72, 0.2)", borderRadius: "20px", padding: "28px", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "12px", color: "#fff" }}>
              Explore Free StudyHub 2.0 Study Resources
            </h2>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "#d6d3d1", marginBottom: "18px" }}>
              In addition to Spark AI assistance, StudyHub 2.0 offers completely free study materials with zero subscriptions or paywalls:
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/" style={{ background: "#fff", color: "#1c1917", textDecoration: "none", padding: "8px 16px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 700 }}>
                Chapter-Wise Notes
              </Link>
              <Link href="/" style={{ background: "#fff", color: "#1c1917", textDecoration: "none", padding: "8px 16px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 700 }}>
                10-Year Board PYQs
              </Link>
              <Link href="/" style={{ background: "#fff", color: "#1c1917", textDecoration: "none", padding: "8px 16px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 700 }}>
                NCERT Exemplar Solutions
              </Link>
              <Link href="/" style={{ background: "#fff", color: "#1c1917", textDecoration: "none", padding: "8px 16px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 700 }}>
                Personal Study Tracker
              </Link>
            </div>
          </section>

          {/* Call to action */}
          <div style={{ textAlign: "center", padding: "32px 20px" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "12px", color: "#fff" }}>
              Ready to boost your CBSE Class 10 preparation?
            </h3>
            <p style={{ color: "#a8a29e", fontSize: "0.95rem", marginBottom: "20px" }}>
              Experience the power of Spark AI by Ansh today and score your dream marks in Boards.
            </p>
            <Link
              href="/tutor"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                color: "#fff",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: "999px",
                fontSize: "1.05rem",
                fontWeight: 800,
              }}
            >
              Open Spark AI chat
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "24px 20px", textAlign: "center", fontSize: "0.85rem", color: "#78716c" }}>
          <div>© 2026 StudyHub 2.0 · Developed by Ansh Yadav</div>
          <div style={{ marginTop: "6px" }}>
            <Link href="/" style={{ color: "#a8a29e", textDecoration: "none", marginRight: "16px" }}>StudyHub 2.0 Home</Link>
            <Link href="/spark-ai" style={{ color: "#fda4af", textDecoration: "none", marginRight: "16px", fontWeight: 700 }}>Spark AI</Link>
            <Link href="/tutor" style={{ color: "#a8a29e", textDecoration: "none" }}>AI Tutor Chat</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
