import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Pehle Google Gemini se try karein
    if (geminiKey) {
      try {
        const contents = (history || []).map((h: { role: string; content: string }) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        }));

        if (contents.length === 0) {
          contents.push({ role: "user", parts: [{ text: message }] });
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [
                  {
                    text: "You are an AI Study Tutor for Class 10 CBSE students on StudyHub. Keep answers concise, clear, and easy to understand in English or Hinglish as requested.",
                  },
                ],
              },
            }),
          }
        );

        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (res.ok && reply) {
          return NextResponse.json({ reply, provider: "gemini" });
        }
      } catch {
        console.warn("Gemini call failed, switching to Groq fallback...");
      }
    }

    // 2. Agar Gemini fail ho ya key na ho, Groq fallback chalega
    if (groqKey) {
      try {
        const groqMessages = [
          {
            role: "system",
            content: "You are an AI Study Tutor for Class 10 CBSE students on StudyHub. Keep explanations simple and encouraging.",
          },
          ...(history || []).map((h: { role: string; content: string }) => ({
            role: h.role,
            content: h.content,
          })),
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: groqMessages,
          }),
        });

        const groqData = await groqRes.json();
        const groqReply = groqData?.choices?.[0]?.message?.content;

        if (groqRes.ok && groqReply) {
          return NextResponse.json({ reply: groqReply, provider: "groq" });
        }
      } catch {
        console.warn("Groq call failed too.");
      }
    }

    return NextResponse.json(
      { error: "AI service currently unavailable. Please check your API keys." },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}