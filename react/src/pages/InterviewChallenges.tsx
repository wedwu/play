import { useState, type ComponentType } from "react";
import Autocomplete from "@/components/interview/Autocomplete";
import CustomHooksDemo from "@/components/interview/CustomHooksDemo";
import FocusTrapModal from "@/components/interview/FocusTrapModal";
import GenericList from "@/components/interview/GenericList";
import InterviewQA from "@/components/interview/InterviewQA";
import InterviewQuiz from "@/components/interview/InterviewQuiz";

type Challenge = {
  id: string;
  label: string;
  blurb: string;
  Component: ComponentType;
};

const CHALLENGES: Challenge[] = [
  {
    id: "autocomplete",
    label: "Autocomplete",
    blurb: "Debounced typeahead with keyboard nav, async results, and ARIA combobox roles.",
    Component: Autocomplete,
  },
  {
    id: "hooks",
    label: "Custom Hooks",
    blurb: "useDebounce + useFetch + useLocalStorage wired into a live GitHub lookup.",
    Component: CustomHooksDemo,
  },
  {
    id: "modal",
    label: "Modal",
    blurb: "Portal dialog with focus trap, Escape/backdrop close, and focus restoration.",
    Component: FocusTrapModal,
  },
  {
    id: "generics",
    label: "Generic <List<T>>",
    blurb: "One generic component renders two different element types, fully type-safe.",
    Component: GenericList,
  },
  {
    id: "qa",
    label: "Q&A",
    blurb:
      "Model answers to the most-asked React, hooks, TanStack Query, TypeScript & tooling questions.",
    Component: InterviewQA,
  },
  {
    id: "quiz",
    label: "Quiz",
    blurb:
      "Multiple-choice quiz built from the Q&A bank — pick an answer for instant correct/incorrect feedback and a running score.",
    Component: InterviewQuiz,
  },
];

export default function InterviewChallenges() {
  const [activeId, setActiveId] = useState(CHALLENGES[0].id);
  const active = CHALLENGES.find((c) => c.id === activeId)!;
  const Active = active.Component;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#e6edf3",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        padding: "28px 24px 60px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#3b82f6" }}>$</span>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            React Interview Challenges
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "monospace", marginBottom: 20 }}>
          The four highest-ROI live-coding exercises — React 19 · ES6 · TypeScript
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #21262d", marginBottom: 6 }}>
          {CHALLENGES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                background: "transparent",
                color: activeId === c.id ? "#e6edf3" : "#6b7280",
                border: "none",
                borderBottom:
                  activeId === c.id ? "2px solid #3b82f6" : "2px solid transparent",
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "#8b949e", lineHeight: 1.6, margin: "12px 0 18px" }}>
          {active.blurb}
        </p>

        <Active />
      </div>
    </div>
  );
}
