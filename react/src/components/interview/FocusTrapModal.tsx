import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ui } from "./styles";

/**
 * CHALLENGE: Build an accessible modal. The details interviewers probe:
 *   - render via a portal (escape parent overflow / z-index traps)
 *   - close on Escape and on backdrop click (but NOT inner click)
 *   - trap Tab focus inside the dialog while open
 *   - move focus in on open, restore it to the trigger on close
 *   - lock body scroll, set role="dialog" + aria-modal
 */

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, onClose, title, children }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element (or the dialog itself).
    const node = dialogRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables?.[0] ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;

      const items = node.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      // Wrap focus at the edges.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus(); // restore focus to trigger
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose} // backdrop click closes
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(1,4,9,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} // inner click stays open
        style={{
          ...ui.panel,
          width: "100%",
          maxWidth: 420,
          outline: "none",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#e6edf3" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ ...ui.ghostButton, padding: "2px 10px" }}>
            ✕
          </button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

const FocusTrapModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={ui.panel}>
      <p style={ui.label}>Open the dialog, then try Tab, Shift+Tab, Escape, and backdrop click</p>
      <button style={{ ...ui.button, marginTop: 12 }} onClick={() => setOpen(true)}>
        Open modal
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Confirm action">
        <p style={{ fontSize: 14, color: "#b1bac4", lineHeight: 1.6, marginTop: 0 }}>
          Focus is trapped inside this dialog. Tabbing cycles through these controls only, and
          closing returns focus to the button that opened it.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input style={ui.input} placeholder="A focusable field…" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button style={ui.ghostButton} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button style={ui.button} onClick={() => setOpen(false)}>
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default FocusTrapModal;