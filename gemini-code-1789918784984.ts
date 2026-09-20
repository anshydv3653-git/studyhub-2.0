import AITutorChat from "@/components/AITutorChat";

export const metadata = {
  title: "AI Tutor | StudyHub 2.0",
  description: "Chat with your AI study assistant",
};

export default function TutorPage() {
  return (
    <main style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <AITutorChat />
    </main>
  );
}