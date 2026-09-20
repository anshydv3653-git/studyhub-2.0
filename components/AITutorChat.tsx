"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

// =================================================================
// Types
// =================================================================
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  timestamp: string;
}

// =================================================================
// Clean Markdown Parser & Renderer for Gemini-style clean output
// =================================================================
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Split by code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="sparkai-markdown">
      {parts.map((part, pIdx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Code block
          const firstLineEnd = part.indexOf("\n");
          const lang = part
            .slice(3, firstLineEnd > 0 ? firstLineEnd : undefined)
            .trim() || "code";
          const code =
            firstLineEnd > 0
              ? part.slice(firstLineEnd + 1, part.length - 3).replace(/\n$/, "")
              : part.slice(3, -3);
          const codeId = `code-${pIdx}`;

          return (
            <div key={pIdx} className="spark-code-block">
              <div className="spark-code-header">
                <span className="spark-code-lang">{lang}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(code, codeId)}
                  className="spark-copy-btn"
                >
                  {copiedCodeId === codeId ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ color: "#4ade80" }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="spark-pre">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Regular text formatting (headings, lists, bold, inline code, tables)
        const lines = part.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let listType: "ul" | "ol" = "ul";

        const flushList = (key: string) => {
          if (inList) {
            renderedElements.push(
              listType === "ol" ? (
                <ol key={key} className="spark-ol">
                  {listItems}
                </ol>
              ) : (
                <ul key={key} className="spark-ul">
                  {listItems}
                </ul>
              )
            );
            inList = false;
            listItems = [];
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          // Empty line
          if (!trimmed) {
            flushList(`list-flush-${lIdx}`);
            renderedElements.push(<div key={`sp-${lIdx}`} style={{ height: "8px" }} />);
            return;
          }

          // Headings
          if (trimmed.startsWith("### ")) {
            flushList(`list-flush-${lIdx}`);
            renderedElements.push(
              <h3 key={`h3-${lIdx}`} className="spark-h3">
                {formatInline(trimmed.slice(4))}
              </h3>
            );
            return;
          }
          if (trimmed.startsWith("## ")) {
            flushList(`list-flush-${lIdx}`);
            renderedElements.push(
              <h2 key={`h2-${lIdx}`} className="spark-h2">
                {formatInline(trimmed.slice(3))}
              </h2>
            );
            return;
          }
          if (trimmed.startsWith("# ")) {
            flushList(`list-flush-${lIdx}`);
            renderedElements.push(
              <h1 key={`h1-${lIdx}`} className="spark-h1">
                {formatInline(trimmed.slice(2))}
              </h1>
            );
            return;
          }

          // Unordered list item (- or *)
          const ulMatch = trimmed.match(/^[-*•]\s+(.*)/);
          if (ulMatch) {
            if (!inList || listType !== "ul") {
              flushList(`switch-ul-${lIdx}`);
              inList = true;
              listType = "ul";
            }
            listItems.push(
              <li key={`li-${lIdx}`} className="spark-li">
                {formatInline(ulMatch[1])}
              </li>
            );
            return;
          }

          // Ordered list item (1. 2. etc.)
          const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (olMatch) {
            if (!inList || listType !== "ol") {
              flushList(`switch-ol-${lIdx}`);
              inList = true;
              listType = "ol";
            }
            listItems.push(
              <li key={`li-${lIdx}`} className="spark-li">
                {formatInline(olMatch[2])}
              </li>
            );
            return;
          }

          // Table row (| ... |)
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            flushList(`table-flush-${lIdx}`);
            const cells = trimmed
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());
            const isSeparator = cells.every((c) => /^[-:]+$/.test(c));
            if (!isSeparator) {
              renderedElements.push(
                <div key={`tr-${lIdx}`} className="spark-table-row">
                  {cells.map((cell, cIdx) => (
                    <div key={cIdx} className="spark-table-cell">
                      {formatInline(cell)}
                    </div>
                  ))}
                </div>
              );
            }
            return;
          }

          // Blockquote (> ...)
          if (trimmed.startsWith("> ")) {
            flushList(`quote-flush-${lIdx}`);
            renderedElements.push(
              <blockquote key={`bq-${lIdx}`} className="spark-blockquote">
                {formatInline(trimmed.slice(2))}
              </blockquote>
            );
            return;
          }

          // Standard paragraph line
          flushList(`p-flush-${lIdx}`);
          renderedElements.push(
            <p key={`p-${lIdx}`} className="spark-p">
              {formatInline(line)}
            </p>
          );
        });

        flushList(`final-list-${pIdx}`);

        return <div key={pIdx}>{renderedElements}</div>;
      })}
    </div>
  );
}

// Inline formatting: bold (**), italic (*), inline code (`), math brackets
function formatInline(text: string): React.ReactNode {
  // Regex splitting by bold, inline code, and italic
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*|\\\[.*?\\\]|\\\(.*?\\\))/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={idx} className="spark-bold">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={idx} className="spark-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return (
        <em key={idx} className="spark-italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("\\[") && token.endsWith("\\]")) {
      return (
        <span key={idx} className="spark-math-block">
          {token.slice(2, -2)}
        </span>
      );
    }
    if (token.startsWith("\\(") && token.endsWith("\\)")) {
      return (
        <span key={idx} className="spark-math-inline">
          {token.slice(2, -2)}
        </span>
      );
    }
    return token;
  });
}

// =================================================================
// Authentic Gemini-style 4-Point AI Sparkle Star SVG
// =================================================================
function SparkLogo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="40%" stopColor="#60a5fa" />
          <stop offset="75%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {/* Primary 4-pointed sparkle star curve */}
      <path
        d="M50 4 C50 28 28 50 4 50 C28 50 50 72 50 96 C50 72 72 50 96 50 C72 50 50 28 50 4 Z"
        fill="url(#geminiGrad)"
      />
      <circle cx="50" cy="50" r="10" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

// =================================================================
// Main Component: AITutorChat (Gemini-Inspired Ultra-Clean UI)
// =================================================================
export default function AITutorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content:
        "Hi! I'm **SparkAI**, your personal CBSE Class 10 study coach. I'm connected to your StudyHub tracker, so I know your chapters and study goals.\n\nAsk me any doubt, get step-by-step NCERT solutions, or ask what to study next — in English or Hinglish!",
      provider: "gemini",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick suggestion chips (Gemini style)
  const quickSuggestions = [
    {
      icon: "⚡",
      title: "Science High-Weightage",
      prompt: "Bhai Class 10 science boards ke liye highest weightage chapters batao aur unhe kaise cover karein?",
    },
    {
      icon: "💡",
      title: "Explain Ohm's Law",
      prompt: "Can you explain Ohm's Law with simple real-life analogies, formulas, and 1 solved numerical?",
    },
    {
      icon: "📐",
      title: "Maths Revision",
      prompt: "Give me a quick formula sheet and important concepts for Quadratic Equations (CBSE Class 10).",
    },
    {
      icon: "📅",
      title: "Board Exam Timetable",
      prompt: "Create a 3-week revision schedule for a Class 10 student who can study 4 hours daily.",
    },
  ];

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, loading]);

  // Adjust textarea height dynamically
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // Send message
  async function sendMessage(customPrompt?: string) {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              data?.error ||
              "SparkAI is thinking... please try sending your message again in a moment.",
            timestamp: "Just now",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          provider: data.provider || "gemini",
          timestamp: "Just now",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network issue. Please check your internet connection and retry.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyFullMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "initial-welcome",
        role: "assistant",
        content:
          "Hi! I'm **SparkAI**, your personal CBSE Class 10 study coach. I'm connected to your StudyHub tracker, so I know your chapters and study goals.\n\nAsk me any doubt, get step-by-step NCERT solutions, or ask what to study next — in English or Hinglish!",
        provider: "gemini",
        timestamp: "Just now",
      },
    ]);
    setInput("");
  };

  return (
    <div className="gemini-app-root">
      {/* Embedded Gemini Stylesheet */}
      <style>{`
        :root {
          --gemini-bg: #131314;
          --gemini-surface: #1e1f20;
          --gemini-surface-hover: #282a2c;
          --gemini-user-bubble: #282a2c;
          --gemini-text: #e3e3e3;
          --gemini-text-muted: #8e8e93;
          --gemini-border: rgba(255, 255, 255, 0.08);
          --gemini-grad: linear-gradient(135deg, #c084fc, #60a5fa 50%, #22d3ee);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .gemini-app-root {
          position: relative;
          width: 100vw;
          height: 100dvh;
          overflow: hidden;
          background-color: var(--gemini-bg);
          color: var(--gemini-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Ambient Dynamic Multi-Color Mesh Glow */
        .ambient-mesh {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .glow-orb-purple {
          position: absolute;
          top: -12%;
          left: -8%;
          width: 55vw;
          height: 55vw;
          max-width: 650px;
          max-height: 650px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, rgba(147, 51, 234, 0) 70%);
          filter: blur(80px);
          animation: floatOrb 18s ease-in-out infinite alternate;
        }
        .glow-orb-blue {
          position: absolute;
          top: 5%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          max-width: 600px;
          max-height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.13) 0%, rgba(59, 130, 246, 0) 70%);
          filter: blur(90px);
          animation: floatOrb 22s ease-in-out infinite alternate-reverse;
        }
        .glow-orb-cyan {
          position: absolute;
          bottom: -15%;
          left: 30%;
          width: 45vw;
          height: 45vw;
          max-width: 550px;
          max-height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.09) 0%, rgba(244, 63, 94, 0.06) 50%, rgba(0, 0, 0, 0) 70%);
          filter: blur(100px);
          animation: floatOrb 26s ease-in-out infinite alternate;
        }
        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
          100% { transform: translate(-20px, 30px) scale(0.95); }
        }

        /* Header Navigation */
        .gemini-header {
          position: relative;
          z-index: 20;
          height: 56px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(19, 19, 20, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--gemini-border);
          flex-shrink: 0;
        }
        .header-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #f1f3f4, #c4c7c5);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .model-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gemini-text-muted);
          background: transparent;
          border: 1px solid transparent;
          padding: 6px 13px;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nav-action-btn:hover {
          color: var(--gemini-text);
          background: var(--gemini-surface);
          border-color: var(--gemini-border);
        }

        /* Main Chat Stream Container */
        .chat-scroll-viewport {
          position: relative;
          z-index: 10;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .chat-stream-inner {
          max-width: 768px;
          margin: 0 auto;
          padding: 24px 20px 140px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Message Rows */
        .msg-row-user {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }
        .user-pill {
          max-width: 82%;
          background: var(--gemini-user-bubble);
          color: #f1f3f4;
          padding: 12px 18px;
          border-radius: 20px 20px 4px 20px;
          font-size: 15px;
          line-height: 1.55;
          word-break: break-word;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .msg-row-ai {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
        }
        .ai-avatar-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(30, 31, 32, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          margin-top: 2px;
          box-shadow: 0 2px 10px rgba(168, 85, 247, 0.2);
        }
        .ai-body-col {
          flex: 1;
          min-width: 0;
          color: var(--gemini-text);
          font-size: 15px;
          line-height: 1.7;
        }

        /* Markdown Styles Inside AI Reply */
        .sparkai-markdown {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .spark-p {
          margin-bottom: 4px;
        }
        .spark-h1 {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin: 16px 0 8px;
          letter-spacing: -0.02em;
        }
        .spark-h2 {
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
          margin: 14px 0 6px;
          letter-spacing: -0.01em;
        }
        .spark-h3 {
          font-size: 16px;
          font-weight: 700;
          color: #f1f3f4;
          margin: 12px 0 4px;
        }
        .spark-bold {
          font-weight: 700;
          color: #ffffff;
        }
        .spark-italic {
          font-style: italic;
          color: #cbd5e1;
        }
        .spark-inline-code {
          background: rgba(255, 255, 255, 0.08);
          color: #38bdf8;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13.5px;
          padding: 2px 6px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .spark-ul, .spark-ol {
          margin: 6px 0 6px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .spark-li {
          padding-left: 2px;
        }
        .spark-blockquote {
          border-left: 3px solid #818cf8;
          padding-left: 12px;
          margin: 8px 0;
          color: #94a3b8;
          font-style: italic;
        }
        .spark-math-block {
          display: block;
          background: rgba(30, 31, 32, 0.6);
          border: 1px solid var(--gemini-border);
          border-radius: 8px;
          padding: 8px 14px;
          font-family: ui-monospace, monospace;
          color: #7dd3fc;
          margin: 6px 0;
          overflow-x: auto;
        }
        .spark-math-inline {
          font-family: ui-monospace, monospace;
          color: #7dd3fc;
          background: rgba(255, 255, 255, 0.05);
          padding: 1px 5px;
          border-radius: 4px;
        }

        /* Code Blocks */
        .spark-code-block {
          background: #1e1f20;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin: 10px 0;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .spark-code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .spark-code-lang {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .spark-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .spark-copy-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .spark-pre {
          padding: 14px;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13.5px;
          line-height: 1.6;
          color: #e2e8f0;
        }

        /* Table Rendering */
        .spark-table-row {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 0;
        }
        .spark-table-cell {
          flex: 1;
          padding: 4px 8px;
          font-size: 14px;
        }

        /* AI Message Actions Bar */
        .ai-msg-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          padding-top: 6px;
        }
        .msg-provider-tag {
          font-size: 11px;
          font-weight: 600;
          color: #71717a;
          letter-spacing: 0.02em;
        }
        .msg-copy-full-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #71717a;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 3px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .msg-copy-full-btn:hover {
          color: #d4d4d8;
          background: rgba(255, 255, 255, 0.06);
        }

        /* Typing / Thinking Shimmer Indicator */
        .thinking-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
        }
        .thinking-avatar-spin {
          animation: sparkSpin 3.5s linear infinite;
        }
        @keyframes sparkSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .thinking-bubble {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(30, 31, 32, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 500;
        }
        .thinking-shimmer-bar {
          width: 60px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg, #60a5fa, #c084fc, #22d3ee, #60a5fa);
          background-size: 200% 100%;
          animation: shimmerMove 1.6s linear infinite;
        }
        @keyframes shimmerMove {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* Suggestion Chips (when starting chat) */
        .suggestions-container {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .suggestions-title {
          font-size: 12px;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }
        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .suggestion-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(30, 31, 32, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #d4d4d8;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .suggestion-card:hover {
          background: var(--gemini-surface-hover);
          border-color: rgba(168, 85, 247, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }
        .suggestion-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .suggestion-label {
          font-size: 13px;
          font-weight: 600;
          color: #f1f3f4;
          line-height: 1.4;
        }

        /* Pinned Floating Bottom Input Bar (Gemini Style) */
        .floating-input-bar-wrap {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          padding: 0 20px max(14px, env(safe-area-inset-bottom));
          pointer-events: none;
        }
        .floating-input-bar {
          max-width: 768px;
          margin: 0 auto;
          pointer-events: auto;
          position: relative;
          background: rgba(30, 31, 32, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 8px 10px 8px 20px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .floating-input-bar:focus-within {
          border-color: rgba(168, 85, 247, 0.45);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(168, 85, 247, 0.2);
        }
        .gemini-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f1f3f4;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.5;
          resize: none;
          max-height: 180px;
          min-height: 24px;
          padding: 6px 0;
        }
        .gemini-textarea::placeholder {
          color: #80868b;
        }

        .gemini-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gemini-send-btn.active {
          background: linear-gradient(135deg, #9333ea, #3b82f6, #06b6d4);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(147, 51, 234, 0.45);
        }
        .gemini-send-btn.active:hover {
          transform: scale(1.06);
          filter: brightness(1.1);
        }
        .gemini-send-btn.disabled {
          background: rgba(255, 255, 255, 0.06);
          color: #5f6368;
          cursor: not-allowed;
        }

        .input-sub-disclaimer {
          max-width: 768px;
          margin: 6px auto 0;
          text-align: center;
          font-size: 11px;
          color: #71717a;
          pointer-events: auto;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .gemini-header {
            padding: 0 14px;
            height: 52px;
          }
          .brand-title {
            font-size: 16px;
          }
          .model-pill span:last-child {
            display: none;
          }
          .chat-stream-inner {
            padding: 18px 14px 130px;
            gap: 22px;
          }
          .user-pill {
            max-width: 90%;
            font-size: 14.5px;
            padding: 10px 15px;
          }
          .ai-avatar-wrap {
            width: 28px;
            height: 28px;
          }
          .suggestions-grid {
            grid-template-columns: 1fr;
          }
          .floating-input-bar-wrap {
            padding: 0 12px max(10px, env(safe-area-inset-bottom));
          }
          .floating-input-bar {
            padding: 6px 8px 6px 16px;
            border-radius: 24px;
          }
          .gemini-textarea {
            font-size: 14px;
          }
        }
      `}</style>

      {/* Dynamic Ambient Glow Mesh */}
      <div className="ambient-mesh">
        <div className="glow-orb-purple" />
        <div className="glow-orb-blue" />
        <div className="glow-orb-cyan" />
      </div>

      {/* Minimalist Pinned Top Header */}
      <header className="gemini-header">
        <div className="header-brand-group">
          <SparkLogo size={26} />
          <span className="brand-title">SparkAI</span>
          <div className="model-pill">
            <span className="status-dot" />
            <span>Gemini 2.5 Flash</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={handleNewChat}
            className="nav-action-btn"
            title="Start a fresh chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>New Chat</span>
          </button>
          <a href="/" className="nav-action-btn" title="Back to StudyHub main site">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Home</span>
          </a>
        </div>
      </header>

      {/* Full-Screen Scrollable Chat Stream */}
      <main className="chat-scroll-viewport">
        <div className="chat-stream-inner">
          {messages.map((m) => (
            <div key={m.id}>
              {m.role === "user" ? (
                <div className="msg-row-user">
                  <div className="user-pill">{m.content}</div>
                </div>
              ) : (
                <div className="msg-row-ai">
                  <div className="ai-avatar-wrap">
                    <SparkLogo size={20} />
                  </div>
                  <div className="ai-body-col">
                    <MarkdownRenderer content={m.content} />
                    <div className="ai-msg-actions">
                      <span className="msg-provider-tag">
                        ✨ SparkAI • {m.provider === "groq" ? "Groq 120B Fallback" : "Gemini 2.5 Flash"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyFullMessage(m.content, m.id)}
                        className="msg-copy-full-btn"
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ color: "#4ade80" }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Show Suggestion Chips only under the initial welcome message */}
                    {m.id === "initial-welcome" && messages.length === 1 && (
                      <div className="suggestions-container">
                        <span className="suggestions-title">Try asking SparkAI</span>
                        <div className="suggestions-grid">
                          {quickSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="suggestion-card"
                              onClick={() => sendMessage(item.prompt)}
                            >
                              <span className="suggestion-icon">{item.icon}</span>
                              <span className="suggestion-label">{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking / Shimmer Indicator when awaiting response */}
          {loading && (
            <div className="thinking-row">
              <div className="ai-avatar-wrap thinking-avatar-spin">
                <SparkLogo size={20} />
              </div>
              <div className="thinking-bubble">
                <div className="thinking-shimmer-bar" />
                <span>SparkAI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: "4px" }} />
        </div>
      </main>

      {/* Pinned Floating Rounded-Pill Input Bar (Gemini Style) */}
      <footer className="floating-input-bar-wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="floating-input-bar"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask SparkAI anything (Science doubts, Math steps, exam tips)..."
            rows={1}
            className="gemini-textarea"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`gemini-send-btn ${input.trim() && !loading ? "active" : "disabled"}`}
            title="Send message"
          >
            {loading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>

        <p className="input-sub-disclaimer">
          SparkAI is calibrated for CBSE Class 10. Check important formulas and numericals with NCERT.
        </p>
      </footer>
    </div>
  );
}
