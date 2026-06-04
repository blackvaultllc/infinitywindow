import { useState, useEffect } from "react";

export default function InfinityPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const min = 3000;
    const max = 15000;
    let t;

    const tryOpen = () => {
      try {
        const active = localStorage.getItem("popup_active");
        if (!active) {
          setVisible(true);
          try {
            localStorage.setItem("popup_active", "infinity");
          } catch {}
        } else {
          // another popup is active — retry after a short random delay
          t = setTimeout(tryOpen, 2000 + Math.random() * 5000);
        }
      } catch {
        setVisible(true);
        try {
          localStorage.setItem("popup_active", "infinity");
        } catch {}
      }
    };

    t = setTimeout(tryOpen, Math.floor(min + Math.random() * (max - min)));
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setVisible(false);
    try {
      localStorage.removeItem("popup_active");
    } catch {}
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, fontFamily: "'Barlow', sans-serif"
    }}>
      <div style={{
        background: "#0a0a0a", border: "1.5px solid #c9a227",
        borderRadius: 4, maxWidth: 420, width: "90%", overflow: "hidden",
        boxShadow: "0 0 40px rgba(201,162,39,0.18)"
      }}>
        <div style={{
          background: "#c9a227", padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: "2.5px", color: "#0a0a0a" }}>
            ∞ NEW UNIVERSE DROPPING
          </span>
          <button onClick={close} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "#0a0a0a", fontWeight: 700
          }}>✕</button>
        </div>

        <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#c9a227", lineHeight: 1 }}>∞8</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#fff", letterSpacing: 2, margin: "8px 0 4px", lineHeight: 1.1 }}>
            Captain Infinity<br />&amp; The Infinity 8s
          </div>
          <div style={{ fontSize: 12, color: "#c9a227", letterSpacing: 3, textTransform: "uppercase", marginBottom: 18 }}>
            Original IP Universe
          </div>
          <div style={{ width: 40, height: 1, background: "#c9a227", opacity: 0.4, margin: "0 auto 18px" }} />
          <p style={{ fontSize: 14, color: "#ccc", lineHeight: 1.65, marginBottom: 24 }}>
            An <strong style={{ color: "#fff" }}>original multimedia universe</strong> is being built.
            Follow the official Facebook page for drops, lore reveals, and the full Infinity universe rollout.
          </p>

          <a
            href="https://www.facebook.com/captaininfinity8"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "block", background: "#c9a227", color: "#0a0a0a",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 2,
              border: "none", borderRadius: 2, padding: "13px 20px",
              textDecoration: "none", textAlign: "center", marginBottom: 10
            }}
          >
            Follow on Facebook →
          </a>
          <button onClick={close} style={{
            fontSize: 12, color: "#666", cursor: "pointer", letterSpacing: 1,
            textTransform: "uppercase", background: "none", border: "none", width: "100%"
          }}>
            maybe later
          </button>
        </div>
      </div>
    </div>
  );
}