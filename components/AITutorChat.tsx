// components/AITutorChat.tsx
//
// Redesigned AI Tutor UI: a glass chat panel floating over a subtle
// animated 3D background (Three.js) — slow-drifting, softly glowing
// geometric shapes in a study-themed palette (amber/teal/coral/blue,
// one loosely per subject). Talks to app/api/ai-tutor/route.ts.
//
// Install first:
//   npm install three
//
// Usage: <AITutorChat /> — renders full-bleed, so give its parent
// a fixed height (e.g. a dedicated /tutor page with height: 100vh).

"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  provider?: "gemini" | "groq";
};

// -----------------------------------------------------------------
// Animated 3D background
// -----------------------------------------------------------------
function TutorBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // subject-inspired palette: math(amber) science(teal) sst(coral) english(blue) hindi(violet)
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
    const count = 9;

    for (let i = 0; i < count; i++) {
      const geo = geometries[i % geometries.length];
      const color = palette[i % palette.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const scale = 0.6 + Math.random() * 1.1;
      mesh.scale.setScalar(scale);

      const spread = 9;
      mesh.position.set(
        (Math.random() - 0.5) * spread * 1.6,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * 6 - 2
      );

      scene.add(mesh);
      floaters.push({
        mesh,
        speed: 0.15 + Math.random() * 0.25,
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
        f.mesh.position.y += Math.sin(t * f.speed + f.phase) * 0.003;
        f.mesh.position.x += Math.cos(t * f.speed * 0.7 + f.phase) * 0.002;
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

// -----------------------------------------------------------------
// Chat UI
// -----------------------------------------------------------------
export default function AITutorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I can see your study progress. Ask me what to study next, get help with a topic, or ask for schedule advice — in whichever language you're comfortable with.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      // This calls your Next.js API route — no key goes here.
      // Server-side (app/api/ai-tutor/route.ts) reads GEMINI_API_KEY
      // and GROQ_API_KEY from environment variables. Put your real
      // keys in .env.local / your hosting provider's env settings —
      // never in this file.
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Something went wrong, please try again." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, provider: data.provider },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>
      <TutorBackground />
      <div style={styles.vignette} />

      <div style={styles.panel}>
        <div style={styles.panelGlow} />
        <div style={styles.header}>
          <div style={styles.headerDot} />
          <div>
            <div style={styles.headerTitle}>AI Study Tutor</div>
            <div style={styles.headerSub}>Live with your tracker data</div>
          </div>
        </div>

        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubbleRow,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                animation: "msgIn 0.35s ease both",
                animationDelay: `${Math.min(i, 4) * 0.03}s`,
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
              <div style={{ ...styles.bubble, ...styles.assistantBubble, ...styles.typingBubble }}>
                <span style={{ ...styles.dot, animationDelay: "0s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputRow}>
          <textarea
            style={styles.textarea}
            rows={1}
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.sendBtn} onClick={sendMessage} disabled={loading}>
            <span style={styles.sendBtnGlow} />
            Send
          </button>
        </div>

        <a
          href="https://instagram.com/_build_with_ansh"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.helpFooter}
        >
          Facing an issue? DM @_build_with_ansh — resolved within 24 hours
        </a>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// Styles
// -----------------------------------------------------------------
const keyframes = `
@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
  40% { opacity: 1; transform: scale(1); }
}
@keyframes glowShift {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes borderGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: "100vh",
    background: "radial-gradient(120% 120% at 20% 10%, #1a1033 0%, #0b0e1a 60%, #070810 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontFamily: "'Inter', -apple-system, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  bgCanvas: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
  },
  vignette: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background:
      "radial-gradient(80% 80% at 50% 45%, transparent 40%, rgba(7,8,16,0.75) 100%)",
    pointerEvents: "none",
  },
  panel: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "480px",
    height: "min(680px, 88vh)",
    display: "flex",
    flexDirection: "column",
    borderRadius: "20px",
    background: "rgba(24, 26, 40, 0.55)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  panelGlow: {
    position: "absolute",
    top: "-40%",
    left: "-20%",
    width: "140%",
    height: "60%",
    background:
      "conic-gradient(from 0deg, #e8b93b, #ff7a5c, #b389f0, #6fa8d3, #4fd1c5, #e8b93b)",
    filter: "blur(60px)",
    opacity: 0.18,
    animation: "glowShift 18s linear infinite",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4fd1c5, #6fa8d3)",
    boxShadow: "0 0 12px rgba(79,209,197,0.8)",
    animation: "borderGlow 2.4s ease-in-out infinite",
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 600,
    fontSize: "18px",
    color: "#f4f2fa",
    lineHeight: 1.2,
  },
  headerSub: {
    fontSize: "12px",
    color: "#9aa2b7",
    marginTop: "2px",
  },
  helpFooter: {
    display: "block",
    textAlign: "center",
    padding: "7px 16px 10px",
    fontSize: "10.5px",
    color: "#6b7288",
    textDecoration: "none",
    background: "rgba(0,0,0,0.15)",
  },
  messages: {
    position: "relative",
    flex: 1,
    overflowY: "auto",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  bubbleRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    padding: "11px 15px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.55,
    maxWidth: "82%",
    whiteSpace: "pre-wrap",
    position: "relative",
  },
  userBubble: {
    background: "linear-gradient(135deg, #e8b93b, #ff7a5c)",
    color: "#241a06",
    borderBottomRightRadius: "4px",
    fontWeight: 500,
  },
  assistantBubble: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#eef0f5",
    borderBottomLeftRadius: "4px",
  },
  providerTag: {
    display: "block",
    marginTop: "6px",
    fontSize: "10px",
    color: "#7c8299",
    letterSpacing: "0.02em",
  },
  typingBubble: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
    padding: "14px 16px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#9aa2b7",
    display: "inline-block",
    animation: "dotPulse 1.2s ease-in-out infinite",
  },
  inputRow: {
    position: "relative",
    display: "flex",
    gap: "10px",
    padding: "14px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.15)",
  },
  textarea: {
    flex: 1,
    resize: "none",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#eef0f5",
    padding: "10px 14px",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
    maxHeight: "100px",
  },
  sendBtn: {
    position: "relative",
    background: "linear-gradient(135deg, #e8b93b, #ff7a5c)",
    color: "#241a06",
    border: "none",
    borderRadius: "12px",
    padding: "0 20px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    overflow: "hidden",
  },
  sendBtnGlow: {
    position: "absolute",
    inset: 0,
  },
};
