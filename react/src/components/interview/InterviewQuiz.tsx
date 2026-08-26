import { useState } from "react";
import { QA } from "./qaData";

type Question = {
  q: string;
  topic: string;
  options: string[];
  correct: number; // index into options
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Turn the shared QA bank into a multiple-choice quiz: each question's correct
 * answer is mixed with three distractors sampled from *other* questions' answers.
 * Built once per attempt so options don't reshuffle on every render.
 */
const buildQuiz = (): Question[] => {
  const flat = QA.flatMap((t) => t.items.map((it) => ({ ...it, topic: t.topic })));

  return shuffle(flat).map((it) => {
    // Prefer distractors from the same topic so wrong options are thematically
    // close; backfill from other topics for small topics (< 4 questions).
    const sameTopic = flat.filter((o) => o.topic === it.topic && o.a !== it.a).map((o) => o.a);
    const otherTopic = flat.filter((o) => o.topic !== it.topic).map((o) => o.a);
    const distractors = [...shuffle(sameTopic), ...shuffle(otherTopic)].slice(0, 3);
    const options = shuffle([it.a, ...distractors]);
    return {
      q: it.q,
      topic: it.topic,
      options,
      correct: options.indexOf(it.a),
    };
  });
};

const InterviewQuiz = () => {
  const [quiz, setQuiz] = useState<Question[]>(buildQuiz);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const question = quiz[current];
  const isLast = current === quiz.length - 1;

  const choose = (i: number) => {
    if (picked !== null) return; // lock after first answer
    setPicked(i);
    if (i === question.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
    setPicked(null);
  };

  const restart = () => {
    setQuiz(buildQuiz());
    setCurrent(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div style={{ textAlign: "center", padding: "30px 0" }}>
        <p style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280", margin: 0 }}>
          quiz complete
        </p>
        <p
          style={{
            fontSize: 40,
            fontWeight: 700,
            margin: "8px 0 4px",
            color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f5a623" : "#f87171",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {score} / {quiz.length}
        </p>
        <p style={{ fontSize: 14, color: "#8b949e", margin: "0 0 22px" }}>{pct}% correct</p>
        <button onClick={restart} style={primaryBtn}>
          <span className="material-icons" style={{ fontSize: 17 }}>
            refresh
          </span>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* progress + score */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "monospace",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <span>
          Q{current + 1} / {quiz.length} · {question.topic}
        </span>
        <span>
          score: <span style={{ color: "#22c55e" }}>{score}</span>
        </span>
      </div>
      <div style={{ height: 3, background: "#21262d", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${((current + (picked !== null ? 1 : 0)) / quiz.length) * 100}%`,
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            transition: "width 0.25s ease",
          }}
        />
      </div>

      {/* question */}
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#e6edf3",
          margin: "6px 0 4px",
          lineHeight: 1.4,
        }}
      >
        {question.q}
      </p>

      {/* options */}
      <div style={{ display: "grid", gap: 8 }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct;
          const isPicked = i === picked;
          const reveal = picked !== null;

          let border = "#21262d";
          let bg = "#0d1117";
          let icon: string | null = null;
          let iconColor = "#6b7280";
          if (reveal && isCorrect) {
            border = "#22c55e";
            bg = "rgba(34,197,94,0.08)";
            icon = "check_circle";
            iconColor = "#22c55e";
          } else if (reveal && isPicked && !isCorrect) {
            border = "#f87171";
            bg = "rgba(248,113,113,0.08)";
            icon = "cancel";
            iconColor = "#f87171";
          }

          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={reveal}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                textAlign: "left",
                padding: "12px 14px",
                border: `1px solid ${border}`,
                borderRadius: 8,
                background: bg,
                color: "#c9d1d9",
                fontSize: 13,
                lineHeight: 1.55,
                cursor: reveal ? "default" : "pointer",
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
            >
              <span
                className="material-icons"
                style={{ fontSize: 18, color: iconColor, flexShrink: 0, marginTop: 1 }}
              >
                {icon ?? "radio_button_unchecked"}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* feedback + next */}
      {picked !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 600,
              color: picked === question.correct ? "#22c55e" : "#f87171",
            }}
          >
            {picked === question.correct ? "✓ Correct" : "✗ Incorrect"}
          </span>
          <button onClick={next} style={primaryBtn}>
            {isLast ? "See score" : "Next"}
            <span className="material-icons" style={{ fontSize: 17 }}>
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  border: "1px solid #1f6feb",
  borderRadius: 8,
  background: "#1f6feb",
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "monospace",
};

export default InterviewQuiz;
