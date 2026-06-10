import type { CSSProperties } from "react";

/** Shared dark-theme tokens so the four challenge components stay consistent. */
export const ui = {
  panel: {
    background: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: 10,
    padding: 20,
    color: "#e6edf3",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } satisfies CSSProperties,

  input: {
    width: "100%",
    background: "#010409",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "9px 12px",
    color: "#e6edf3",
    fontSize: 14,
    fontFamily: "monospace",
    outline: "none",
    boxSizing: "border-box",
  } satisfies CSSProperties,

  button: {
    background: "#1f6feb",
    color: "#fff",
    border: "1px solid #1f6feb",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "monospace",
  } satisfies CSSProperties,

  ghostButton: {
    background: "#161b22",
    color: "#8b949e",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "monospace",
  } satisfies CSSProperties,

  muted: { color: "#6b7280", fontSize: 13, fontFamily: "monospace" } satisfies CSSProperties,

  label: {
    color: "#8b949e",
    fontSize: 11,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  } satisfies CSSProperties,
};
