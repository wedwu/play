import { useState } from "react";
import { QA } from "./qaData";

const InterviewQA = () => {
  const [open, setOpen] = useState<string | null>(
    "What problem do hooks solve that class components didn't?"
  );

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {QA.map((topic) => (
        <div key={topic.topic}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#3b82f6",
              margin: "0 0 8px",
              textAlign: "left",
            }}
          >
            {topic.topic}
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {topic.items.map(({ q, a }) => {
              const isOpen = open === q;
              return (
                <div
                  key={q}
                  style={{
                    border: "1px solid #21262d",
                    borderRadius: 8,
                    background: "#0d1117",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : q)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "11px 14px",
                      color: "#e6edf3",
                      fontSize: 13.5,
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{
                        fontSize: 18,
                        color: "#6b7280",
                        transform: isOpen ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      chevron_right
                    </span>
                    {q}
                  </button>
                  {isOpen && (
                    <p
                      style={{
                        margin: 0,
                        padding: "0 14px 14px 40px",
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: "#8b949e",
                        textAlign: "left",
                      }}
                    >
                      {a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterviewQA;
