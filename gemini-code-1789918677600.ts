"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

type Message = {
  role: "user" | "assistant";
  content: string;
  provider?: "gemini" | "groq";
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
};

function TutorBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const palette = [0xe8b93b, 0x4fd1c5, 0xff7a5c, 0x6fa8d3, 0xb389f0];
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);
    const light1 = new THREE.PointLight(0xe8b93b, 60, 30);
    light1.position.set(6, 4, 8);
    scene.add(light1);
    const light2 = new THREE.PointLight(0x6fa8d3, 60, 30);
    light2.position.set(-6, -4, 6);
    scene.add(light2);

    const geometries = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.7, 0.25, 12, 32),
      new THREE.TetrahedronGeometry(1, 0),
    ];

    type Floater = { mesh: THREE.Mesh; speed: number; phase: number };
    const floaters: Floater[] = [];

    for (let i = 0; i < 8; i++) {
      const geo = geometries[i % geometries.length];
      const color = palette[i % palette.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.45,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(0.7 + Math.random() * 0.9);
      mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6 - 2);
      scene.add(mesh);
      floaters.push({
        mesh,
        speed: 0.15 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frameId: number;
    const clock = new THREE.Clock();

    function animate() {
      const t = clock.getElapsedTime();
      for (const f of floaters) {
        f.mesh.rotation.x += 0.002 + f.speed * 0.002;
        f.mesh.rotation.y += 0.003 + f.speed * 0.002;
        f.mesh.position.y += Math.sin(t * f.speed + f.phase) * 0.002;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      floaters.forEach((f) => {
        f.mesh.geometry.dispose();
        (f.mesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={styles.bgCanvas} aria-hidden="true" />;
}

export default function AITutorChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem("studyhub_chat_sessions");
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    initNewChat();
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("studyhub_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === currentSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function initNewChat() {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      createdAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content: "Hi! Main aapka StudyHub AI Tutor hoon. Koi bhi question ya doubt ho, pucho!",
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else {
        initNewChat();
      }
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !activeSession) return;

    const userMsg: Message = { role: "user", content: text };
    let newTitle = activeSession.title;
    if (activeSession.title === "New Chat") {
      newTitle = text.slice(0, 24) + (text.length > 24 ? "..." : "");
    }

    const updatedMessages = [...activeSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, title: newTitle, messages: updatedMessages } : s
      )
    );

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.slice(-6),
        }),
      });

      const data = await res.json();
      const replyMsg: Message = {
        role: "assistant",
        content: res.ok ? data.reply : (data.error || "Kuch error hua, kripya dobara try karein."),
        provider: data.provider,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...updatedMessages, replyMsg] } : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...updatedMessages,
                  { role: "assistant", content: "Network issue — connection check karein." },
                ],
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <TutorBackground />
      <div style={styles.vignette} />

      <div style={styles.container}>
        {/* SIDEBAR (HISTORY) */}
        <div style={{ ...styles.sidebar, width: sidebarOpen ? "250px" : "0px", opacity: sidebarOpen ? 1 : 0 }}>
          <div style={styles.sidebarHeader}>
            <button style={styles.newChatBtn} onClick={initNewChat}>
              + New Chat
            </button>
          </div>

          <div style={styles.historyList}>
            <div style={styles.historyLabel}>Recent Chats</div>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  ...styles.historyItem,
                  background: s.id === currentSessionId ? "rgba(232, 185, 59, 0.16)" : "transparent",
                  borderColor: s.id === currentSessionId ? "rgba(232, 185, 59, 0.35)" : "transparent",
                }}
                onClick={() => setCurrentSessionId(s.id)}
              >
                <span style={styles.historyTitle}>{s.title}</span>
                <button style={styles.delBtn} onClick={(e) => deleteSession(s.id, e)} title="Delete chat">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT INTERFACE */}
        <div style={styles.chatPanel}>
          <div style={styles.header}>
            <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div style={styles.headerDot} />
            <div>
              <div style={styles.headerTitle}>{activeSession?.title || "AI Study Tutor"}</div>
              <div style={styles.headerSub}>StudyHub Live Tutor</div>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubbleRow,
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.role === "user" ? styles.userBubble : styles.assistantBubble),
                  }}
                >
                  {m.content}
                  {m.provider && <span style={styles.providerTag}>{m.provider}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
                <div style={{ ...styles.bubble, ...styles.assistantBubble }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={styles.inputRow}>
            <textarea
              style={styles.textarea}
              rows={1}
              placeholder="Ask anything about Class 10 syllabus..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button style={styles.sendBtn} onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100vh",
    background: "radial-gradient(120% 120% at 20% 10%, #1a1033 0%, #0b0e1a 60%, #070810 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  },
  bgCanvas: { position: "absolute", inset: 0, zIndex: 0 },
  vignette: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background: "radial-gradient(80% 80% at 50% 45%, transparent 40%, rgba(7,8,16,0.85) 100%)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    width: "100%",
    maxWidth: "920px",
    height: "88vh",
    borderRadius: "20px",
    background: "rgba(24, 26, 40, 0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    overflow: "hidden",
  },
  sidebar: {
    height: "100%",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12, 14, 22, 0.6)",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.25s ease",
    overflow: "hidden",
  },
  sidebarHeader: { padding: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  newChatBtn: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #e8b93b, #ff7a5c)",
    color: "#181005",
    border: "none",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  historyList: { flex: 1, overflowY: "auto", padding: "10px" },
  historyLabel: { fontSize: "10px", color: "#8a90a2", textTransform: "uppercase", marginBottom: "8px", paddingLeft: "4px" },
  historyItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid transparent",
    marginBottom: "4px",
    cursor: "pointer",
  },
  historyTitle: { fontSize: "12.5px", color: "#f0edf7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  delBtn: { background: "none", border: "none", color: "#8a90a2", fontSize: "15px", cursor: "pointer" },
  chatPanel: { flex: 1, display: "flex", flexDirection: "column", height: "100%" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  toggleBtn: { background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" },
  headerDot: { width: "9px", height: "9px", borderRadius: "50%", background: "#4fd1c5" },
  headerTitle: { fontSize: "15px", fontWeight: 600, color: "#fff" },
  headerSub: { fontSize: "11px", color: "#8a90a2" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" },
  bubbleRow: { display: "flex", width: "100%" },
  bubble: { padding: "10px 14px", borderRadius: "12px", fontSize: "13.5px", lineHeight: 1.5, maxWidth: "78%", whiteSpace: "pre-wrap" },
  userBubble: { background: "linear-gradient(135deg, #e8b93b, #ff7a5c)", color: "#1c1404", borderBottomRightRadius: "3px" },
  assistantBubble: { background: "rgba(255,255,255,0.07)", color: "#eef0f5", borderBottomLeftRadius: "3px" },
  providerTag: { display: "block", marginTop: "4px", fontSize: "9px", color: "#8a90a2", textTransform: "uppercase" },
  inputRow: { display: "flex", gap: "10px", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  textarea: { flex: 1, resize: "none", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", padding: "9px 12px", outline: "none" },
  sendBtn: { background: "linear-gradient(135deg, #e8b93b, #ff7a5c)", color: "#1c1404", border: "none", borderRadius: "10px", padding: "0 18px", fontWeight: 700, cursor: "pointer" },
};