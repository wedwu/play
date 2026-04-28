import type { CSSProperties } from "react";

/* shared styles */
export const inp: CSSProperties = {
  fontSize: 12,
  padding: "3px 6px",
  border: `0.5px solid ${T.inputBorder}`,
  borderRadius: 6,
  background: T.inputBg,
  color: T.panelText,
  fontFamily: "var(--font-sans)",
  outline: "none",
};

export const btn: CSSProperties = {
  fontSize: 11,
  padding: "3px 10px",
  cursor: "pointer",
  border: `0.5px solid ${T.panelBorder}`,
  borderRadius: 6,
  background: "transparent",
  color: T.panelMuted,
  fontFamily: "var(--font-sans)",
};
