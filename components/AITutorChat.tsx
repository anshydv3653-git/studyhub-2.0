"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// =================================================================
// Types
// =================================================================
interface SourceItem {
  title: string;
  url: string;
  domain: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; mime: string }[];
  isError?: boolean;
  canRetry?: boolean;
  notice?: string;
  modelUsed?: string;
  sources?: SourceItem[];
  searchSuggestionsHtml?: string;
}

interface AttachmentFile {
  name: string;
  mime: string;
  data: string; // Base64 without 'data:...;base64,' prefix
  previewUrl?: string;
  sizeBytes: number;
}

// =================================================================
// Helper: Process and compress attachments
// =================================================================
async function processAttachment(file: File): Promise<AttachmentFile> {
  const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
  if (file.size > MAX_BYTES) {
    throw new Error(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 4MB allowed.`);
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`"${file.name}" has an unsupported format. Please upload PNG, JPG, WebP, or PDF.`);
  }

  // PDF handling
  if (file.type === "application/pdf") {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = () => reject(new Error(`Failed to read PDF "${file.name}".`));
      reader.readAsDataURL(file);
    });

    return {
      name: file.name,
      mime: file.type,
      data: base64,
      sizeBytes: file.size,
    };
  }

  // Image handling with client-side canvas compression (max 1600px longest side, JPEG 0.8)
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;
      const maxDim = 1600;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Image processing failed: Canvas context unavailable."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1] || "";

      resolve({
        name: file.name,
        mime: "image/jpeg",
        data: base64,
        previewUrl: dataUrl,
        sizeBytes: file.size,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image "${file.name}".`));
    };

    img.src = objectUrl;
  });
}

// =================================================================
// Markdown Renderer
// =================================================================
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="sparkai-markdown">
      {parts.map((part, pIdx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          const lang = part.slice(3, firstLineEnd > 0 ? firstLineEnd : undefined).trim() || "code";
          const code = firstLineEnd > 0 ? part.slice(firstLineEnd + 1, part.length - 3).replace(/\n$/, "") : part.slice(3, -3);
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
                    <span style={{ color: "#4ade80" }}>Copied!</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
              <pre className="spark-pre"><code>{code}</code></pre>
            </div>
          );
        }

        const lines = part.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let listType: "ul" | "ol" = "ul";

        const flushList = (key: string) => {
          if (inList) {
            renderedElements.push(
              listType === "ol" ? (
                <ol key={key} className="spark-ol">{listItems}</ol>
              ) : (
                <ul key={key} className="spark-ul">{listItems}</ul>
              )
            );
            inList = false;
            listItems = [];
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            flushList(`lf-${lIdx}`);
            renderedElements.push(<div key={`sp-${lIdx}`} style={{ height: "6px" }} />);
            return;
          }

          if (trimmed.startsWith("### ")) {
            flushList(`lf-${lIdx}`);
            renderedElements.push(<h3 key={`h3-${lIdx}`} className="spark-h3">{formatInline(trimmed.slice(4))}</h3>);
            return;
          }
          if (trimmed.startsWith("## ")) {
            flushList(`lf-${lIdx}`);
            renderedElements.push(<h2 key={`h2-${lIdx}`} className="spark-h2">{formatInline(trimmed.slice(3))}</h2>);
            return;
          }
          if (trimmed.startsWith("# ")) {
            flushList(`lf-${lIdx}`);
            renderedElements.push(<h1 key={`h1-${lIdx}`} className="spark-h1">{formatInline(trimmed.slice(2))}</h1>);
            return;
          }

          const ulMatch = trimmed.match(/^[-*•]\s+(.*)/);
          if (ulMatch) {
            if (!inList || listType !== "ul") {
              flushList(`sw-ul-${lIdx}`);
              inList = true;
              listType = "ul";
            }
            listItems.push(<li key={`li-${lIdx}`} className="spark-li">{formatInline(ulMatch[1])}</li>);
            return;
          }

          const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (olMatch) {
            if (!inList || listType !== "ol") {
              flushList(`sw-ol-${lIdx}`);
              inList = true;
              listType = "ol";
            }
            listItems.push(<li key={`li-${lIdx}`} className="spark-li">{formatInline(olMatch[2])}</li>);
            return;
          }

          flushList(`p-${lIdx}`);
          renderedElements.push(<p key={`p-${lIdx}`} className="spark-p">{formatInline(line)}</p>);
        });

        flushList(`final-${pIdx}`);
        return <div key={pIdx}>{renderedElements}</div>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={idx} className="spark-bold">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={idx} className="spark-inline-code">{token.slice(1, -1)}</code>;
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={idx} className="spark-italic">{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

// =================================================================
// 3D Animated Spark Logo Component
// =================================================================
function SparkLogo({ size = 26, isSparking = false }: { size?: number; isSparking?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isSparking ? "drop-shadow(0 0 10px rgba(192, 132, 252, 0.8))" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <defs>
          <linearGradient id="sparkGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="35%" stopColor="#60a5fa" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <path
          d="M50 2 C50 28 28 50 2 50 C28 50 50 72 50 98 C50 72 72 50 98 50 C72 50 50 28 50 2 Z"
          fill="url(#sparkGradPrimary)"
        />
        <circle cx="50" cy="50" r="10" fill="#ffffff" />
      </svg>
    </div>
  );
}

// =================================================================
// Main Component: AITutorChat
// =================================================================
export default function AITutorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gemini-2.5-flash" | "gpt-oss-120b">("gemini-2.5-flash");
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auth State
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("there");
  const [authLoading, setAuthLoading] = useState(true);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Suggestion chips required by prompt
  const suggestionChips = [
    "What can you do?",
    "Explain a topic",
    "How is my study tracker going?",
    "Tell me about my profile",
  ];

  // Load auth session and student name on mount
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          setSessionToken(null);
          setAuthLoading(false);
          return;
        }

        setSessionToken(session.access_token);

        // Fetch student profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", session.user.id)
          .maybeSingle();

        const name = profile?.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || "there";
        if (!mounted) return;
        setStudentName(name);

        // Set initial personalized greeting
        setMessages([
          {
            id: "initial-welcome",
            role: "assistant",
            content: `Hi ${name}! 👋 What can I help you with?`,
          },
        ]);
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSessionToken(session?.access_token || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, loading, isSearchingWeb]);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 3) {
      setUploadError("You can attach a maximum of 3 files per message.");
      return;
    }

    try {
      const processed: AttachmentFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const p = await processAttachment(files[i]);
        processed.push(p);
      }
      setAttachments((prev) => [...prev, ...processed]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process attached file.";
      setUploadError(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  // Stop Generation via AbortController
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setIsSearchingWeb(false);
  };

  // Start fresh chat
  const handleNewChat = () => {
    handleStop();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Hi ${studentName}! 👋 What can I help you with?`,
      },
    ]);
    setInput("");
    setAttachments([]);
    setUploadError(null);
  };

  // Send message
  async function sendMessage(customPrompt?: string, retryMessages?: ChatMessage[]) {
    const text = (customPrompt || input).trim();
    if ((!text && attachments.length === 0) || loading) return;
    if (text.length > 4000) {
      alert("Message exceeds the 4000 characters limit. Please shorten your message.");
      return;
    }

    if (!sessionToken) {
      alert("Please log in to chat with Spark AI.");
      return;
    }

    let updatedMessages: ChatMessage[];
    let currentAttachments: AttachmentFile[] = [];

    if (retryMessages) {
      updatedMessages = retryMessages;
    } else {
      currentAttachments = [...attachments];
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        role: "user",
        content: text,
        attachments: currentAttachments.map((a) => ({ name: a.name, mime: a.mime })),
      };
      updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setAttachments([]);
      setUploadError(null);
    }

    // Determine model (attachments force gemini-2.5-flash)
    const activeModel = currentAttachments.length > 0 ? "gemini-2.5-flash" : selectedModel;

    // Create assistant streaming placeholder
    const assistantMsgId = `asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
      },
    ]);

    setLoading(true);
    setIsSearchingWeb(false);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare payload: send last 20 messages, attachments only on last message
      const payloadMessages = updatedMessages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload: {
        model: string;
        messages: { role: string; content: string }[];
        attachments?: { name: string; mime: string; data: string }[];
        web: boolean;
      } = {
        model: activeModel,
        messages: payloadMessages,
        web: liveSearchEnabled,
      };

      if (currentAttachments.length > 0) {
        payload.attachments = currentAttachments.map((a) => ({
          name: a.name,
          mime: a.mime,
          data: a.data,
        }));
      }

      // Call server route on same origin
      const res = await fetch("/api/spark-ai-chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Handle HTTP status errors per contract
      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again.";
        if (res.status === 401) {
          errMsg = "Your session has expired. Please log in again to continue.";
        } else if (res.status === 404 || res.status === 503) {
          errMsg = "Spark AI is being set up, please try again soon.";
        } else if (res.status === 413) {
          errMsg = "Uploaded files are too large. Max 4MB allowed per file.";
        } else if (res.status === 429) {
          errMsg = "You have reached the limit of 10 live web searches per hour. Please wait a little or toggle Live Search off to continue instantly.";
        } else if (res.status >= 500) {
          errMsg = "The model encountered an error. You can retry or switch to the other model.";
        } else {
          try {
            const errData = await res.json();
            if (errData?.error) errMsg = errData.error;
          } catch {}
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: errMsg, isError: true, canRetry: true } : m
          )
        );
        return;
      }

      // Stream text/event-stream response
      if (!res.body) throw new Error("No response body received from Spark AI.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataContent = trimmed.slice(5).trim();
          if (dataContent === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataContent);

            if (parsed.status === "searching") {
              setIsSearchingWeb(true);
            }
            if (parsed.model_used) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, modelUsed: parsed.model_used } : m))
              );
            }
            if (parsed.notice) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, notice: parsed.notice } : m))
              );
            }
            if (parsed.delta) {
              setIsSearchingWeb(false);
              accumulated += parsed.delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
              );
            }
            if (parsed.sources) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, sources: parsed.sources } : m))
              );
            }
            if (parsed.search_suggestions_html) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, searchSuggestionsHtml: parsed.search_suggestions_html } : m
                )
              );
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: "Network or connection error. Please check your internet connection and try again.",
                isError: true,
                canRetry: true,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      setIsSearchingWeb(false);
      abortControllerRef.current = null;
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  // Handle Retry
  const handleRetry = () => {
    const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const messagesUpToLastUser = messages.slice(0, lastUserIdx + 1);
    sendMessage(undefined, messagesUpToLastUser);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auth Guard: If not logged in, show login prompt
  if (!authLoading && !sessionToken) {
    return (
      <div className="sparkai-app-root">
        <style>{`
          .auth-guard-card {
            max-width: 480px;
            margin: 120px auto 40px;
            padding: 36px 28px;
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          }
          .auth-guard-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 24px;
            padding: 12px 28px;
            border-radius: 999px;
            background: linear-gradient(135deg, #c084fc, #38bdf8);
            color: #000;
            font-weight: 800;
            text-decoration: none;
            transition: transform 0.2s;
          }
          .auth-guard-btn:hover {
            transform: translateY(-2px);
          }
        `}</style>
        <div className="auth-guard-card">
          <SparkLogo size={48} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "16px", color: "#fff" }}>
            Sign in to access Spark AI
          </h2>
          <p style={{ fontSize: "0.92rem", color: "#a1a1aa", marginTop: "8px", lineHeight: 1.5 }}>
            Spark AI is your personalized Class 10 study assistant and doubt solver. Sign in to your StudyHub account to start chatting.
          </p>
          <a href="/?login=1" className="auth-guard-btn">
            Log In to StudyHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="sparkai-app-root">
      <style>{`
        :root {
          --spark-bg: #121214;
          --spark-surface: #1e1e24;
          --spark-user-bubble: #272730;
          --spark-text: #f4f4f5;
          --spark-text-muted: #a1a1aa;
          --spark-border: rgba(255, 255, 255, 0.08);
          --spark-grad: linear-gradient(135deg, #c084fc, #60a5fa 50%, #22d3ee);
        }

        .sparkai-app-root {
          position: fixed;
          inset: 0;
          background: var(--spark-bg);
          color: var(--spark-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .spark-header {
          height: 56px;
          border-bottom: 1px solid var(--spark-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: rgba(18, 18, 20, 0.85);
          backdrop-filter: blur(12px);
          z-index: 20;
        }

        .header-brand-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-title {
          font-size: 17px;
          font-weight: 800;
          background: var(--spark-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--spark-border);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--spark-text);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Scrollable chat body */
        .chat-scroll-viewport {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .chat-stream-inner {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 20px 180px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .msg-row-user {
          display: flex;
          justify-content: flex-end;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .user-pill {
          max-width: 82%;
          background: var(--spark-user-bubble);
          color: #fff;
          padding: 12px 18px;
          border-radius: 20px 20px 4px 20px;
          font-size: 15px;
          line-height: 1.5;
          word-break: break-word;
        }

        .user-attachment-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px 10px;
          border-radius: 999px;
          color: #93c5fd;
        }

        .msg-row-ai {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .ai-avatar-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid var(--spark-border);
          margin-top: 2px;
        }

        .ai-body-col {
          flex: 1;
          min-width: 0;
        }

        /* Notice chip under routed answer */
        .msg-notice-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
        }

        /* Sources row */
        .msg-sources-wrap {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .msg-sources-label {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--spark-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
          display: block;
        }
        .msg-sources-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .msg-source-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #93c5fd;
          text-decoration: none;
          transition: all 0.15s;
        }
        .msg-source-chip:hover {
          background: rgba(147, 197, 253, 0.15);
          border-color: rgba(147, 197, 253, 0.35);
          transform: translateY(-1px);
        }

        /* Search suggestions HTML container (Google required) */
        .msg-search-suggestions {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12.5px;
          color: #d4d4d8;
        }

        /* Suggestion chips under greeting */
        .suggestions-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--spark-text);
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-chip:hover {
          background: rgba(192, 132, 252, 0.15);
          border-color: rgba(192, 132, 252, 0.4);
          transform: translateY(-1px);
        }

        /* Floating Input Bar */
        .floating-input-bar-wrap {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(18, 18, 20, 0.95) 30%);
          padding: 16px 20px 20px;
          z-index: 30;
        }

        .floating-input-bar {
          max-width: 820px;
          margin: 0 auto;
          background: rgba(30, 30, 36, 0.92);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 10px 14px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        }

        .attachment-previews {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .attachment-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          color: #e4e4e7;
        }

        .attachment-remove-btn {
          background: none;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 14px;
          padding: 0 2px;
        }
        .attachment-remove-btn:hover {
          color: #f43f5e;
        }

        .input-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .spark-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.5;
          resize: none;
          max-height: 160px;
          min-height: 24px;
          padding: 6px 0;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          color: var(--spark-text-muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .send-btn {
          background: linear-gradient(135deg, #a855f7, #38bdf8);
          color: #fff;
        }
        .send-btn:disabled {
          background: rgba(255, 255, 255, 0.06);
          color: #52525b;
          cursor: not-allowed;
        }

        .stop-btn {
          background: #f43f5e;
          color: #fff;
        }

        /* Model selector dropdown */
        .model-select {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e4e4e7;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        /* Live Web Search toggle */
        .live-search-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #a1a1aa;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .live-search-toggle.active {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.45);
          color: #34d399;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #71717a;
          transition: background 0.2s;
        }
        .live-search-toggle.active .live-dot {
          background: #34d399;
          box-shadow: 0 0 6px #34d399;
        }

        /* Markdown Styles */
        .sparkai-markdown {
          font-size: 15px;
          line-height: 1.65;
          color: var(--spark-text);
        }
        .spark-h1 { font-size: 1.3rem; font-weight: 800; margin: 12px 0 6px; }
        .spark-h2 { font-size: 1.15rem; font-weight: 800; margin: 10px 0 4px; }
        .spark-h3 { font-size: 1.05rem; font-weight: 700; margin: 8px 0 4px; }
        .spark-p { margin-bottom: 8px; }
        .spark-ul, .spark-ol { padding-left: 22px; margin-bottom: 8px; }
        .spark-li { margin-bottom: 4px; }
        .spark-bold { font-weight: 700; color: #fff; }
        .spark-inline-code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .spark-code-block {
          background: #18181b;
          border: 1px solid var(--spark-border);
          border-radius: 8px;
          margin: 12px 0;
          overflow: hidden;
        }
        .spark-code-header {
          display: flex;
          justify-content: space-between;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 12px;
          color: var(--spark-text-muted);
        }
        .spark-copy-btn {
          background: none;
          border: none;
          color: var(--spark-text-muted);
          cursor: pointer;
        }
        .spark-pre {
          padding: 12px;
          margin: 0;
          overflow-x: auto;
          font-family: monospace;
          font-size: 13.5px;
        }

        .retry-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .retry-btn {
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #f43f5e;
          cursor: pointer;
        }
      `}</style>

      {/* Top Header */}
      <header className="spark-header">
        <div className="header-brand-group">
          <SparkLogo size={26} isSparking={loading} />
          <span className="brand-title">Spark AI by Ansh</span>
        </div>

        <div className="header-actions">
          <button type="button" onClick={handleNewChat} className="header-btn" title="Start a new chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            <span>New Chat</span>
          </button>
          <a href="/" className="header-btn" title="Back to StudyHub">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
            <span>StudyHub</span>
          </a>
        </div>
      </header>

      {/* Chat Stream Viewport */}
      <main className="chat-scroll-viewport">
        <div className="chat-stream-inner">
          {messages.map((m) => (
            <div key={m.id}>
              {m.role === "user" ? (
                <div className="msg-row-user">
                  {m.attachments && m.attachments.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {m.attachments.map((att, i) => (
                        <span key={i} className="user-attachment-badge">
                          📎 {att.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="user-pill">{m.content}</div>
                </div>
              ) : (
                <div className="msg-row-ai">
                  <div className="ai-avatar-wrap">
                    <SparkLogo size={20} />
                  </div>
                  <div className="ai-body-col">
                    <MarkdownRenderer content={m.content} />

                    {/* Notice chip if routed */}
                    {m.notice && (
                      <div>
                        <div className="msg-notice-chip">
                          ⚡ {m.notice}
                        </div>
                      </div>
                    )}

                    {/* Grounded Web Sources List */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="msg-sources-wrap">
                        <span className="msg-sources-label">Sources</span>
                        <div className="msg-sources-list">
                          {m.sources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="msg-source-chip"
                              title={s.title}
                            >
                              <span>🌐</span>
                              <span>{s.domain}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Suggestions Widget HTML (Google required) */}
                    {m.searchSuggestionsHtml && (
                      <div
                        className="msg-search-suggestions"
                        dangerouslySetInnerHTML={{ __html: m.searchSuggestionsHtml }}
                      />
                    )}

                    {/* Suggestion Chips under initial greeting */}
                    {m.id.startsWith("initial-welcome") || m.id.startsWith("welcome-") ? (
                      messages.length <= 2 && (
                        <div className="suggestions-group">
                          {suggestionChips.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="suggestion-chip"
                              onClick={() => sendMessage(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )
                    ) : null}

                    {/* Retry / Switch model options on error */}
                    {m.isError && m.canRetry && (
                      <div className="retry-bar">
                        <button type="button" className="retry-btn" onClick={handleRetry}>
                          ↻ Retry
                        </button>
                        <button
                          type="button"
                          className="header-btn"
                          style={{ fontSize: "12px", padding: "4px 12px" }}
                          onClick={() => {
                            setSelectedModel((prev) =>
                              prev === "gemini-2.5-flash" ? "gpt-oss-120b" : "gemini-2.5-flash"
                            );
                            handleRetry();
                          }}
                        >
                          Try the other model
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="msg-row-ai">
              <div className="ai-avatar-wrap">
                <SparkLogo size={20} isSparking={true} />
              </div>
              <div className="ai-body-col" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", color: "var(--spark-text-muted)" }}>
                  {isSearchingWeb ? "🔍 Searching the web for live Class 10 sources..." : "Spark AI is thinking..."}
                </span>
                <button
                  type="button"
                  onClick={handleStop}
                  className="header-btn"
                  style={{ background: "#f43f5e", color: "#fff", borderColor: "transparent", padding: "3px 10px", fontSize: "12px" }}
                >
                  ■ Stop
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: "4px" }} />
        </div>
      </main>

      {/* Floating Bottom Input Bar */}
      <footer className="floating-input-bar-wrap">
        <div className="floating-input-bar">
          {/* File Attachment Previews */}
          {attachments.length > 0 && (
            <div className="attachment-previews">
              {attachments.map((att, idx) => (
                <div key={idx} className="attachment-chip">
                  <span>📎 {att.name}</span>
                  <button type="button" className="attachment-remove-btn" onClick={() => removeAttachment(idx)}>
                    &times;
                  </button>
                </div>
              ))}
              <span style={{ fontSize: "11px", color: "#93c5fd", alignSelf: "center" }}>
                Files are read by Gemini 2.5 Flash
              </span>
            </div>
          )}

          {uploadError && (
            <div style={{ color: "#f43f5e", fontSize: "12px", marginBottom: "6px" }}>
              ⚠️ {uploadError}
            </div>
          )}

          <div className="input-row">
            {/* Paperclip file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              multiple
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach images or PDF (Max 3, 4MB each)"
              disabled={loading || attachments.length >= 3}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>

            {/* Live Web Search Toggle (Default ON) */}
            <button
              type="button"
              onClick={() => setLiveSearchEnabled((prev) => !prev)}
              className={`live-search-toggle ${liveSearchEnabled ? "active" : ""}`}
              title={liveSearchEnabled ? "Live web search is enabled" : "Live web search is disabled"}
              disabled={loading}
            >
              <span className="live-dot" />
              <span>Live Search</span>
            </button>

            {/* Model Selector Dropdown */}
            <select
              value={attachments.length > 0 ? "gemini-2.5-flash" : selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as "gemini-2.5-flash" | "gpt-oss-120b")}
              disabled={attachments.length > 0 || loading}
              className="model-select"
              title={attachments.length > 0 ? "Files require Gemini 2.5 Flash" : "Select model"}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gpt-oss-120b">GPT-OSS 120B</option>
            </select>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Spark AI anything (doubts, chapter revision, PYQs)..."
              rows={1}
              maxLength={4000}
              className="spark-textarea"
            />

            {/* Character limit counter */}
            {input.length > 3000 && (
              <span style={{ fontSize: "11px", color: input.length >= 3900 ? "#f43f5e" : "#a1a1aa", alignSelf: "center" }}>
                {input.length}/4000
              </span>
            )}

            {/* Send / Stop Button */}
            {loading ? (
              <button type="button" className="icon-btn stop-btn" onClick={handleStop} title="Stop generating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn send-btn"
                onClick={() => sendMessage()}
                disabled={(!input.trim() && attachments.length === 0) || loading}
                title="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
